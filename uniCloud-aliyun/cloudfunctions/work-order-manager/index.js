'use strict';
const uniID = require('uni-id-common')
const db = uniCloud.database()
const dbCmd = db.command

exports.main = async (event, context) => {
	const { action, params } = event
	const uniIdIns = uniID.createInstance({ context })
	
	// Check Token for all actions
	const payload = await uniIdIns.checkToken(event.uniIdToken)
	if (payload.code !== 0) {
		return payload
	}
	const uid = payload.uid
	
	// Action: Create Work Order
	if (action === 'create') {
		const orderData = {
			...params,
			creator_uid: uid,
			create_date: Date.now()
		}
		
		const res = await db.collection('jiushun-work-orders').add(orderData)
		
		return {
			code: 0,
			msg: '提交成功',
			id: res.id
		}
	}
	
	// Action: List Work Orders (My Orders)
	if (action === 'list') {
		// If admin/employee, maybe see all? For now, stick to requirements: "View own" or "View all" for employees
		// Let's implement: Employees see ALL, others see OWN.
		
		const userRes = await db.collection('uni-id-users').doc(uid).get()
		const roles = userRes.data[0].role || []
		const canViewAll = roles.includes('admin') || roles.includes('玖顺员工')
		
		let match = {}
		if (!canViewAll) {
			match = { creator_uid: uid }
		}
		
		const res = await db.collection('jiushun-work-orders')
			.where(match)
			.orderBy('create_date', 'desc')
			.limit(20) // Pagination could be added later
			.get()
			
		return {
			code: 0,
			data: res.data
		}
	}
	
	// Action: Get Detail
	if (action === 'get') {
		const { id } = params
		if (!id) return { code: 400, msg: 'ID required' }
		
		const res = await db.collection('jiushun-work-orders').doc(id).get()
		
		if (res.data.length === 0) return { code: 404, msg: '工单不存在' }
		
		// Optional: Permission check (is creator or admin?)
		
		return {
			code: 0,
			data: res.data[0]
		}
	}

	return {
		code: 404,
		msg: 'Unknown Action'
	}
};