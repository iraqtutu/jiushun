'use strict';
const uniID = require('uni-id-common')
const db = uniCloud.database()
const dbCmd = db.command

// ========== 角色定义 ==========
const ADMIN_ROLES = ['admin']
const DATA_ANALYST_ROLES = ['数据分析员']

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

	// Helper: Check if user has any of the target roles
	const hasRole = (userRoles, targetRoles) => {
		return (userRoles || []).some(r => targetRoles.includes(r))
	}

	// Action: List Work Orders (My Orders or Query)
	if (action === 'list') {
		const userRes = await db.collection('uni-id-users').doc(uid).get()
		const roles = userRes.data[0].role || []
		const isAdmin = hasRole(roles, ADMIN_ROLES)
		const isDataAnalyst = hasRole(roles, DATA_ANALYST_ROLES)

		let match = {}
		const {
			page = 1,
			pageSize = 10,
			startDate,
			endDate,
			customerName,
			customerPhone,
			reporterName,
			productModel
		} = params

		// 1. Permission Setup
		// Admin and Data Analyst can view all orders
		if (!isAdmin && !isDataAnalyst) {
			// Non-privileged users can ONLY view their own
			match.creator_uid = uid
		}

		// 2. Query Parameters
		// Date Range Filter (Available to ALL)
		if (startDate || endDate) {
			if (startDate && endDate) {
				match.create_date = dbCmd.gte(startDate).and(dbCmd.lte(endDate))
			} else if (startDate) {
				match.create_date = dbCmd.gte(startDate)
			} else if (endDate) {
				match.create_date = dbCmd.lte(endDate)
			}
		}

		// Advanced Filters (Admin and Data Analyst ONLY)
		if (isAdmin || isDataAnalyst) {
			if (customerName) match['customer.name'] = new RegExp(customerName, 'i')
			if (customerPhone) match['customer.phone'] = new RegExp(customerPhone, 'i')
			if (productModel) match['product.model'] = new RegExp(productModel, 'i')

			if (reporterName) {
				const reporterRes = await db.collection('uni-id-users')
					.where(dbCmd.or([
						{ nickname: new RegExp(reporterName, 'i') },
						{ username: new RegExp(reporterName, 'i') },
						{ mobile: new RegExp(reporterName, 'i') }
					]))
					.field({ _id: 1 })
					.get()

				const reporterIds = reporterRes.data.map(u => u._id)
				if (reporterIds.length > 0) {
					match.creator_uid = dbCmd.in(reporterIds)
				} else {
					return { code: 0, data: [], total: 0 }
				}
			}
		}
		
		// 3. Execute Count and Data Query
		const totalRes = await db.collection('jiushun-work-orders').where(match).count()
		const total = totalRes.total

		const res = await db.collection('jiushun-work-orders')
			.aggregate()
			.match(match)
			.sort({ create_date: -1 })
			.skip((page - 1) * pageSize)
			.limit(pageSize)
			.lookup({
				from: 'uni-id-users',
				localField: 'creator_uid',
				foreignField: '_id',
				as: 'userInfo'
			})
			.end()
			
		// Flatten userInfo for list display
		const data = res.data.map(item => {
			if (item.userInfo && item.userInfo.length > 0) {
				item.reporterName = item.userInfo[0].nickname || item.userInfo[0].username || item.userInfo[0].mobile
			}
			delete item.userInfo
			return item
		})
			
		return {
			code: 0,
			data: data,
			total: total
		}
	}
	
	// Action: Get Detail
	if (action === 'get') {
		const { id } = params
		if (!id) return { code: 400, msg: 'ID required' }

		// Permission Check for Detail
		const userRes = await db.collection('uni-id-users').doc(uid).get()
		const roles = userRes.data[0].role || []
		const isAdmin = hasRole(roles, ADMIN_ROLES)
		const isDataAnalyst = hasRole(roles, DATA_ANALYST_ROLES)

		let match = { _id: id }
		if (!isAdmin && !isDataAnalyst) {
			// Non-privileged users can ONLY view their own detail
			match.creator_uid = uid
		}
		
		// Use aggregate to join with user info
		const res = await db.collection('jiushun-work-orders').aggregate()
			.match(match)
			.lookup({
				from: 'uni-id-users',
				localField: 'creator_uid',
				foreignField: '_id',
				as: 'userInfo'
			})
			.end()
		
		if (res.data.length === 0) return { code: 404, msg: '服务单不存在' }
		
		const order = res.data[0]
		// Flatten userInfo for easier frontend access
		if (order.userInfo && order.userInfo.length > 0) {
			order.userInfo = {
				nickname: order.userInfo[0].nickname || order.userInfo[0].name
			}
		}
		
		return {
			code: 0,
			data: order
		}
	}
	
	// Action: Update Work Order (Admin Only)
	if (action === 'update') {
		const { id, data } = params
		if (!id) return { code: 400, msg: 'ID required' }
		
		// Permission Check
		const userRes = await db.collection('uni-id-users').doc(uid).get()
		const roles = userRes.data[0].role || []
		if (!hasRole(roles, ADMIN_ROLES)) {
			return { code: 403, msg: '无权修改' }
		}
		
		// Remove fields that shouldn't be updated via this action if any
		delete data._id
		delete data.create_date
		delete data.creator_uid
		
		await db.collection('jiushun-work-orders').doc(id).update(data)
		
		return {
			code: 0,
			msg: '修改成功'
		}
	}
	
	// Action: Delete Work Order (Admin Only)
	if (action === 'delete') {
		const { id } = params
		if (!id) return { code: 400, msg: 'ID required' }
		
		// Permission Check
		const userRes = await db.collection('uni-id-users').doc(uid).get()
		const roles = userRes.data[0].role || []
		if (!hasRole(roles, ADMIN_ROLES)) {
			return { code: 403, msg: '无权删除' }
		}
		
		await db.collection('jiushun-work-orders').doc(id).remove()

		return {
			code: 0,
			msg: '删除成功'
		}
	}

	// Action: Export Work Orders (Admin and Data Analyst Only)
	if (action === 'export') {
		const userRes = await db.collection('uni-id-users').doc(uid).get()
		const roles = userRes.data[0].role || []
		const isAdmin = hasRole(roles, ADMIN_ROLES)
		const isDataAnalyst = hasRole(roles, DATA_ANALYST_ROLES)

		if (!isAdmin && !isDataAnalyst) {
			return { code: 403, msg: '无权导出' }
		}

		const {
			startDate,
			endDate,
			customerName,
			customerPhone,
			reporterName,
			productModel
		} = params

		let match = {}

		// Date Range Filter
		if (startDate || endDate) {
			if (startDate && endDate) {
				match.create_date = dbCmd.gte(startDate).and(dbCmd.lte(endDate))
			} else if (startDate) {
				match.create_date = dbCmd.gte(startDate)
			} else if (endDate) {
				match.create_date = dbCmd.lte(endDate)
			}
		}

		// Advanced Filters
		if (customerName) match['customer.name'] = new RegExp(customerName, 'i')
		if (customerPhone) match['customer.phone'] = new RegExp(customerPhone, 'i')
		if (productModel) match['product.model'] = new RegExp(productModel, 'i')

		if (reporterName) {
			const reporterRes = await db.collection('uni-id-users')
				.where(dbCmd.or([
					{ nickname: new RegExp(reporterName, 'i') },
					{ username: new RegExp(reporterName, 'i') },
					{ mobile: new RegExp(reporterName, 'i') }
				]))
				.field({ _id: 1 })
				.get()

			const reporterIds = reporterRes.data.map(u => u._id)
			if (reporterIds.length > 0) {
				match.creator_uid = dbCmd.in(reporterIds)
			} else {
				return { code: 0, data: [], total: 0 }
			}
		}

		// Get all matching records (no pagination for export)
		const res = await db.collection('jiushun-work-orders')
			.aggregate()
			.match(match)
			.sort({ create_date: -1 })
			.lookup({
				from: 'uni-id-users',
				localField: 'creator_uid',
				foreignField: '_id',
				as: 'userInfo'
			})
			.end()

		// Collect all file IDs for URL conversion
		const fileIds = new Set();
		res.data.forEach(item => {
			const p = item.product || {};
			if (p.platePhoto) fileIds.add(p.platePhoto);
			if (item.customerConfirm?.machineUserPhoto) fileIds.add(item.customerConfirm.machineUserPhoto);
			const faultItems = (item.service || {}).faultItems || [];
			faultItems.forEach(f => {
				if (f.sitePhotos) {
					f.sitePhotos.forEach(photo => {
						if (photo) fileIds.add(photo);
					});
				}
			});
		});

		// Convert file IDs to HTTP URLs
		const fileIdToUrl = {};
		if (fileIds.size > 0) {
			try {
				const urlRes = await uniCloud.getTempFileURL({
					fileList: Array.from(fileIds)
				});
				if (urlRes.fileList) {
					urlRes.fileList.forEach(f => {
						if (f.fileID && f.tempFileURL) {
							fileIdToUrl[f.fileID] = f.tempFileURL;
						}
					});
				}
			} catch (e) {
				console.error('批量转换文件URL失败:', e);
			}
		}

		// Helper to get HTTP URL from file ID
		const getUrl = (fileId) => {
			if (!fileId) return '';
			if (fileId.startsWith('http')) return fileId;
			return fileIdToUrl[fileId] || fileId;
		};

		// Transform data for export (same as frontend loadData transformation)
		const data = res.data.map(item => {
			const c = item.customer || {};
			const p = item.product || {};
			const s = item.service || {};
			const faultItems = s.faultItems || [];

			// 1. Aggregate Fault Categories, Descs, and Handles
			const categories = faultItems.map(f => f.category).filter(v => v).join('\n');
			const descs = faultItems.map(f => `【${f.category}】${f.faultDesc}`).filter(v => v).join('\n');
			const handles = faultItems.map(f => `【${f.category}】${f.handleDesc}`).filter(v => v).join('\n');

			// 2. Aggregate Parts Info
			let allParts = [];
			let partsTotal = 0;
			faultItems.forEach(f => {
				(f.parts || []).forEach(pt => {
					let str = `[${f.category}] ${pt.name}(${pt.code})x${pt.count} 旧件:${pt.oldPartAction || '带回'} 来源:${pt.source || '自带'}`;
					if (pt.sourceRemark) str += `(${pt.sourceRemark})`;
					if (s.isChargeable === '收费') {
						const price = Number(pt.price) || 0;
						const count = Number(pt.count) || 0;
						const subtotal = Number(pt.total) || (price * count);
						str += ` 单价:${price} 小计:${subtotal.toFixed(1)}`;
						partsTotal += subtotal;
					} else {
						partsTotal += (Number(pt.total) || 0);
					}
					allParts.push(str);
				});
			});
			const partsStr = allParts.join('\n');

			// 3. Aggregate Site Photos
			let sitePhotos = [];
			faultItems.forEach(f => {
				if (f.sitePhotos && f.sitePhotos.length > 0) {
					sitePhotos = sitePhotos.concat(f.sitePhotos);
				}
			});

			const af = item.additionalFees || {};
			const isChargeable = s.isChargeable || '免费';
			const travelFeeTotal = af.travelFee?.total || 0;
			const laborFeeTotal = af.laborFee?.total || 0;
			const grandTotal = af.totalAmount ? (Number(af.totalAmount) + partsTotal) : partsTotal;

			// 4. Reporter name from lookup
			const reporter = (item.userInfo && item.userInfo.length > 0)
				? (item.userInfo[0].nickname || item.userInfo[0].username || item.userInfo[0].mobile)
				: '未知';

			delete item.userInfo;

			return {
				id: item._id,
				orderNo: item.orderNo,
				reporterName: reporter,
				create_date: item.create_date,

				// Customer
				distributorName: c.distributorName || '-',
				customerName: c.name || '未知',
				customerPhone: c.phone || '-',
				customerAddress: c.address || '-',
				usageType: c.usageType || '-',
				reportTime: c.reportTime,

				// Product
				productModel: p.model || '-',
				machineNo: p.machineNo || '-',
				engineNo: p.engineNo || '-',
				productionDate: p.productionDate,
				workHours: p.workHours || '',

				// Service
				serviceType: s.type || '未知',
				isChargeable: isChargeable,
				paymentMethod: s.paymentMethod || '-',
				partsTotal: partsTotal.toFixed(1),
				travelFeeTotal: Number(travelFeeTotal).toFixed(1),
				laborFeeTotal: Number(laborFeeTotal).toFixed(1),
				grandTotal: grandTotal.toFixed(1),
				faultCategory: categories || '-',
				faultDesc: descs || '-',
				handleDesc: handles || '-',
				partsInfo: partsStr || '无',
				finishTime: s.finishTime,

				// Additional fields for export
				travelDistance: af.travelFee?.distance || 0,
				repairDuration: af.laborFee?.repairDuration || 0,

				// Image URLs (converted from cloud:// IDs)
				platePhoto: getUrl(p.platePhoto),
				sitePhotos: sitePhotos.map(photo => getUrl(photo)),
				machineUserPhoto: getUrl(item.customerConfirm?.machineUserPhoto)
			}
		})

		// Summary statistics
		const summary = {
			totalCount: data.length,
			// 可以根据需要添加更多汇总字段
		}

		return {
			code: 0,
			data: data,
			summary: summary
		}
	}

	// Helper function to convert cloud file IDs to HTTP URLs
	async function getHttpUrl(fileId) {
		if (!fileId) return '';
		// If already HTTP URL, return as is
		if (fileId.startsWith('http')) return fileId;
		// If cloud path, convert to HTTP URL
		if (fileId.startsWith('cloud://')) {
			try {
				const urlRes = await uniCloud.getTempFileURL({
					fileList: [fileId]
				});
				if (urlRes.fileList && urlRes.fileList[0] && urlRes.fileList[0].tempFileURL) {
					return urlRes.fileList[0].tempFileURL;
				}
			} catch (e) {
				console.error('转换文件URL失败:', e);
			}
		}
		return fileId;
	}

	// Action: Get Customer History (for auto-fill)
	if (action === 'getCustomerHistory') {
		// This action doesn't require auth token - it's called during form editing
		const { customerName } = params
		if (!customerName || customerName.length < 2) {
			return { code: 0, data: null }
		}

		// Find the most recent order for this customer (exact match only)
		const res = await db.collection('jiushun-work-orders')
			.where({
				'customer.name': customerName
			})
			.orderBy('create_date', 'desc')
			.limit(1)
			.field({
				customer: true
			})
			.get()

		if (res.data.length === 0) {
			return { code: 0, data: null }
		}

		const customer = res.data[0].customer || {}
		return {
			code: 0,
			data: {
				phone: customer.phone || '',
				address: customer.address || '',
				distributorName: customer.distributorName || '',
				usageType: customer.usageType || '自用'
			}
		}
	}

	// Action: Get Distributors (with permission control)
	if (action === 'getDistributors') {
		const userRes = await db.collection('uni-id-users').doc(uid).get()
		const roles = userRes.data[0].role || []
		const isAdmin = hasRole(roles, ADMIN_ROLES)
		const isJiushunEmployee = hasRole(roles, ['玖顺员工'])

		let match = {}

		// Only admin and 玖顺员工 can see all distributors
		// Other users can only see distributors with selfWarranty === true
		if (!isAdmin && !isJiushunEmployee) {
			match.selfWarranty = true
		}

		const res = await db.collection('jiushun-distributors')
			.where(match)
			.limit(500)
			.get()

		return {
			code: 0,
			data: res.data
		}
	}

	return {
		code: 404,
		msg: 'Unknown Action'
	}
};