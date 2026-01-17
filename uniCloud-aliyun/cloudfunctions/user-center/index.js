'use strict';
const uniID = require('uni-id-common')
const createConfig = require('uni-config-center')
const db = uniCloud.database()
const dbCmd = db.command

exports.main = async (event, context) => {
	const { action, params } = event
	const uniIdIns = uniID.createInstance({ context })
	
	// Helper to get WeChat Config
	const getWeChatConfig = () => {
		const uniIdConfig = createConfig({ pluginId: 'uni-id' }).config()
		return uniIdConfig['mp-weixin'].oauth.weixin
	}
	
	// 1. Login with WeChat
	if (action === 'login') {
		const { code } = params
		if (!code) return { code: 400, msg: 'Code required' }
		
		const wxConfig = getWeChatConfig()
		
		// Exchange code for session
		const url = `https://api.weixin.qq.com/sns/jscode2session?appid=${wxConfig.appid}&secret=${wxConfig.appsecret}&js_code=${code}&grant_type=authorization_code`
		const wxRes = await uniCloud.httpclient.request(url, { dataType: 'json' })
		
		if (wxRes.data.errcode) {
			return { code: wxRes.data.errcode, msg: wxRes.data.errmsg }
		}
		
		const { openid, session_key } = wxRes.data
		
		// Find user by OpenID
		const userRes = await db.collection('uni-id-users').where({
			"wx_openid.mp-weixin": openid
		}).limit(1).get()
		
		let uid
		let userInfo = {}
		let isAuthorized = false
		let isAdmin = false
		
		if (userRes.data.length > 0) {
			// User Exists
			const user = userRes.data[0]
			uid = user._id
			userInfo = {
				_id: uid,
				nickname: user.nickname,
				role: user.role,
				mobile: user.mobile
			}
			
			const authorizedRoles = ['玖顺员工', '经销商人员', '服务人员', 'admin']
			isAuthorized = (user.role || []).some(r => authorizedRoles.includes(r))
			isAdmin = (user.role || []).includes('admin') || (user.role || []).includes('玖顺员工')
		} else {
			// User Does Not Exist - Create Guest
			const registerRes = await db.collection('uni-id-users').add({
				wx_openid: { "mp-weixin": openid },
				role: [], // No role yet
				register_date: Date.now()
			})
			uid = registerRes.id
		}
		
		// Create Token
		const tokenRes = await uniIdIns.createToken({
			uid,
			role: userInfo.role || []
		})
		
		// Check application status if not authorized
		let applicationStatus = null
		if (!isAuthorized) {
			const appRes = await db.collection('jiushun-account-applications')
				.where({ create_uid: uid })
				.orderBy('create_date', 'desc')
				.limit(1)
				.get()
			
			if (appRes.data.length > 0) {
				applicationStatus = appRes.data[0].status // 0: Pending, 1: Approved, 2: Rejected
			}
		}

		return {
			code: 0,
			token: tokenRes.token,
			tokenExpired: tokenRes.tokenExpired,
			userInfo: { ...userInfo, isAdmin }, // Return admin flag
			authorized: isAuthorized,
			applicationStatus: applicationStatus,
			uid: uid
		}
	}
	
	// 2. Submit Application
	if (action === 'apply') {
		const payload = await uniIdIns.checkToken(event.uniIdToken)
		if (payload.code !== 0) {
			return payload
		}
		
		const uid = payload.uid
		const { name, mobile, role, reason } = params
		
		// Update User Info
		await db.collection('uni-id-users').doc(uid).update({
			mobile: mobile,
			mobile_confirmed: 0,
			nickname: name
		})
		
		// Check if pending exists
		const existing = await db.collection('jiushun-account-applications').where({
			create_uid: uid,
			status: 0
		}).count()
		
		if (existing.total > 0) {
			return { code: 1, msg: '已存在审核中的申请' }
		}
		
		const res = await db.collection('jiushun-account-applications').add({
			create_uid: uid,
			name,
			mobile,
			role,
			reason,
			status: 0,
			create_date: Date.now()
		})
		
		return {
			code: 0,
			msg: 'Application submitted',
			id: res.id
		}
	}
	
	// 3. Get Applications (Admin Only)
	if (action === 'getApplications') {
		const payload = await uniIdIns.checkToken(event.uniIdToken)
		if (payload.code !== 0) return payload
		
		// Check Admin Role
		const userRes = await db.collection('uni-id-users').doc(payload.uid).get()
		const roles = userRes.data[0].role || []
		if (!roles.includes('admin')) {
			return { code: 403, msg: '无权访问' }
		}
		
		const res = await db.collection('jiushun-account-applications')
			.where({ status: 0 }) // Only pending
			.orderBy('create_date', 'asc')
			.get()
			
		return { code: 0, data: res.data }
	}
	
	// 4. Approve/Reject Application (Admin Only)
	if (action === 'auditApplication') {
		const payload = await uniIdIns.checkToken(event.uniIdToken)
		if (payload.code !== 0) return payload
		
		// Check Admin Role
		const adminUserRes = await db.collection('uni-id-users').doc(payload.uid).get()
		const adminRoles = adminUserRes.data[0].role || []
		if (!adminRoles.includes('admin')) {
			return { code: 403, msg: '无权操作' }
		}
		
		const { id, status, rejectReason } = params
		
		// Get Application
		const appRes = await db.collection('jiushun-account-applications').doc(id).get()
		if (appRes.data.length === 0) return { code: 404, msg: '申请不存在' }
		const application = appRes.data[0]
		
		// If Approved (status === 1), Update User Role FIRST
		if (status === 1) {
			try {
				await db.collection('uni-id-users').doc(application.create_uid).update({
					role: [application.role], // Overwrite role
					mobile: application.mobile,
					nickname: application.name,
					mobile_confirmed: 1 // Mark mobile as trusted since admin approved it
				})
			} catch (e) {
				console.error('Update User Fail:', e)
				// Check for duplicate key error (MongoDB/uniCloud error codes for unique constraint)
				if (e.code === 11000 || e.message.includes('duplicate')) {
					return { code: 500, msg: '操作失败：该手机号已被其他账号绑定' }
				}
				return { code: 500, msg: '更新用户信息失败: ' + e.message }
			}
		}
		
		// Update Application Status (Only if user update succeeded or it's a reject)
		await db.collection('jiushun-account-applications').doc(id).update({
			status,
			rejectReason: status === 2 ? rejectReason : '',
			audit_uid: payload.uid,
			audit_date: Date.now()
		})
		
		return { code: 0, msg: '操作成功' }
	}

	return {
		code: 404,
		msg: 'Unknown Action'
	}
};