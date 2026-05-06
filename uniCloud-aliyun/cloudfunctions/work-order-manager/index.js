'use strict';
const uniID = require('uni-id-common')
const ExcelJS = require('exceljs');
const axios = require('axios');
const db = uniCloud.database()
const dbCmd = db.command

// ========== 角色定义 ==========
const ADMIN_ROLES = ['admin']
const DATA_ANALYST_ROLES = ['数据分析员']

// ========== 工具函数 ==========
const formatDateSimple = (date) => {
    const y = date.getFullYear();
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const d = date.getDate().toString().padStart(2, '0');
    return `${y}-${m}-${d}`;
};

const formatTimestamp = (ts) => {
    if (!ts) return '';
    const d = ts instanceof Date ? ts : new Date(ts);
    const y = d.getFullYear();
    const m = (d.getMonth() + 1).toString().padStart(2, '0');
    const date = d.getDate().toString().padStart(2, '0');
    const h = d.getHours().toString().padStart(2, '0');
    const min = d.getMinutes().toString().padStart(2, '0');
    return `${y}-${m}-${date} ${h}:${min}`;
};

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
			productModel,
			format
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

		// Helper to get URL (database stores accessible URLs directly)
		const getUrl = (url) => {
			if (!url) return '';
			return url;
		};

		// Transform data for export (same as frontend loadData transformation)
		const data = res.data.map(item => {
			const c = item.customer || {};
			const p = item.product || {};
			const s = item.service || {};
			const faultItems = s.faultItems || [];

			// 1. Aggregate Fault Categories, Descs, and Handles
			const hasMultipleFaults = faultItems.length > 1;
			const categories = faultItems.map((f, idx) => f.category).filter(v => v).join('\n');
			// 现象：多个故障时加序号和分类名，单个故障时不加
			const descs = faultItems.map((f, idx) => hasMultipleFaults ? `${idx + 1}. 【${f.category}】${f.faultDesc}` : f.faultDesc).filter(v => v).join('\n');
			// 处理方法：多个故障时只加序号，单个故障时不加
			const handles = faultItems.map((f, idx) => hasMultipleFaults ? `${idx + 1}. ${f.handleDesc}` : f.handleDesc).filter(v => v).join('\n');
			// 故障原因：只导出填写了原因的，多个故障时只加序号，单个时不加
			const faultReasonsWithReason = faultItems.filter(f => f.faultReason && f.faultReason.trim());
			const faultReasons = faultReasonsWithReason.map((f, idx) => hasMultipleFaults ? `${idx + 1}、${f.faultReason}` : f.faultReason).join('\n');

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
				reportTime: formatTimestamp(c.reportTime),

				// Product
				productModel: p.model || '-',
				machineNo: p.machineNo || '-',
				engineNo: p.engineNo || '-',
				productionDate: formatTimestamp(p.productionDate),
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
				faultReason: faultReasons || '-',
				handleDesc: handles || '-',
				partsInfo: partsStr || '无',
				finishTime: s.finishTime instanceof Date ? s.finishTime.toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' }) : (s.finishTime ? new Date(s.finishTime).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' }) : '-'),

				// Additional fields for export
				travelDistance: af.travelFee?.distance || 0,
				repairDuration: af.laborFee?.repairDuration || 0,

				// Image URLs (converted from cloud:// IDs)
				platePhoto: getUrl(p.platePhoto),
				sitePhotos: sitePhotos.map(photo => getUrl(photo)),
				machineUserPhoto: getUrl(item.customerConfirm?.machineUserPhoto),
				accompanyingPerson: item.customerConfirm?.accompanyingPerson || '-'
			}
		})

		// ========== xlsx 格式导出 ==========
		if (format === 'xlsx') {
			const PARALLEL_ITEMS = 10; // 减少并发，控制内存和网络
			console.log(`[export] 开始导出，共 ${data.length} 条记录`);

			// 下载图片并转 base64
			const downloadImage = async (url) => {
				if (!url) return null;
				try {
					const response = await axios.get(url, { responseType: 'arraybuffer', timeout: 8000 });
					return Buffer.from(response.data, 'binary').toString('base64');
				} catch (e) {
					console.warn('图片下载失败:', url, e.message);
					return null;
				}
			};

			// 下载单条记录的所有图片（并行下载）
			const downloadImagesForItem = async (item) => {
				// 获取所有现场照片（支持最多16张）
				const siteUrls = (item.sitePhotos || []).slice(0, 6);
				
				// 并行下载所有相关图片
				const [plateBase64, confirmBase64, ...siteBase64List] = await Promise.all([
					downloadImage(item.platePhoto),
					downloadImage(item.machineUserPhoto),
					...siteUrls.map(url => downloadImage(url))
				]);
				
				return {
					...item,
					plateBase64,
					confirmBase64,
					siteBase64List: siteBase64List.filter(Boolean)
				};
			};

			// 创建 xlsx
			const workbook = new ExcelJS.Workbook();
			workbook.creator = 'jiushun';
			workbook.created = new Date();
			const sheet = workbook.addWorksheet('服务单汇总');

			// 设置列宽
			sheet.getColumn(31).width = 15; // 铭牌照片 (索引30)
			sheet.getColumn(32).width = 15; // 人机合影 (索引31)
			for(let c=33; c<=48; c++) sheet.getColumn(c).width = 15; // 现场照片1-16 (索引32-47)

			// 表头行 (将同行人员移到图片前，现场照片移到最后)
			const headers = [
				'服务单号','报单人','提交时间','经销商名称','客户姓名','客户电话',
				'客户地址','农机用途','报修时间','产品型号','机器编号','发动机号',
				'生产日期','工作时长(小时)','服务类型','是否收费',
				'故障分类','故障现象','故障原因','处理方法','更换零件',
				'里程(km)','维修用时(min)','维修完成时间',
				'零件费','路程费','工时费','总应收(元)','支付方式','同行人员',
				'铭牌照片','人机合影',
				'现场照片1','现场照片2','现场照片3','现场照片4','现场照片5','现场照片6','现场照片7','现场照片8',
				'现场照片9','现场照片10','现场照片11','现场照片12','现场照片13','现场照片14','现场照片15','现场照片16'
			];
			sheet.addRow(headers);

			// 分批下载图片并写入行，避免同时在内存中保存所有图片
			for (let i = 0; i < data.length; i += PARALLEL_ITEMS) {
				const chunk = data.slice(i, i + PARALLEL_ITEMS);
				console.log(`[export] 处理第 ${i + 1} ~ ${i + chunk.length} 条记录`);
				// eslint-disable-next-line no-await-in-loop
				const chunkResults = await Promise.all(chunk.map(item => downloadImagesForItem(item)));
				console.log(`[export] 第 ${i + 1} ~ ${i + chunk.length} 条图片下载完成，开始写入Excel`);

				for (const item of chunkResults) {
					// 构造基础数据行，图片位置设为 null 占位
					const row = [
						item.orderNo, item.reporterName, formatDateSimple(new Date(item.create_date)),
						item.distributorName,
						item.customer ? item.customer.name : item.customerName,
						item.customer ? item.customer.phone : item.customerPhone,
						item.customer ? item.customer.address : item.customerAddress,
						item.usageType, item.reportTime,
						item.product ? item.product.model : item.productModel,
						item.machineNo, item.engineNo, item.productionDate,
						item.product ? item.product.workHours : (item.workHours || '-'),
						item.serviceType, item.isChargeable,
						item.faultCategory, item.faultDesc, item.faultReason, item.handleDesc, item.partsInfo,
						item.travelDistance, item.repairDuration, item.finishTime,
						item.partsTotal, item.travelFeeTotal, item.laborFeeTotal, item.grandTotal,
						item.paymentMethod, item.accompanyingPerson,
						null, // 铭牌 (30)
						null, // 人机合影 (31)
						// 现场1-16 (32-47)
						null, null, null, null, null, null, null, null,
						null, null, null, null, null, null, null, null
					];
					const dataRow = sheet.addRow(row);
					const rowNum = dataRow.number;

					// 1. 插入铭牌照片 (列索引 30)
					if (item.plateBase64) {
						const plateImg = workbook.addImage({ base64: item.plateBase64, extension: 'jpeg' });
						sheet.addImage(plateImg, {
							tl: { col: 30, row: rowNum - 1 },
							ext: { width: 120, height: 90 }
						});
					}
					
					// 2. 插入人机合影 (列索引 31)
					if (item.confirmBase64) {
						const confirmImg = workbook.addImage({ base64: item.confirmBase64, extension: 'jpeg' });
						sheet.addImage(confirmImg, {
							tl: { col: 31, row: rowNum - 1 },
							ext: { width: 120, height: 90 }
						});
					}

					// 3. 动态插入现场照片列表 (从列索引 32 开始，支持最多16张)
					if (item.siteBase64List && item.siteBase64List.length > 0) {
						item.siteBase64List.forEach((base64, index) => {
							const siteImg = workbook.addImage({ base64: base64, extension: 'jpeg' });
							sheet.addImage(siteImg, {
								tl: { col: 32 + index, row: rowNum - 1 },
								ext: { width: 120, height: 90 }
							});
						});
					}
				}
				// 处理完一批后显式释放图片内存，防止内存溢出
				chunkResults.forEach(item => {
					item.plateBase64 = null;
					item.confirmBase64 = null;
					item.siteBase64List = null;
				});
			}

			// 生成 buffer 并上传到云存储
			console.log('[export] 开始生成Excel buffer...');
			console.log('[export] writeBuffer 开始，sheet行数:', sheet.rowCount);

			let buffer;
			try {
				// 添加超时检测（120秒）
				const timeoutPromise = new Promise((_, reject) => {
					setTimeout(() => reject(new Error('writeBuffer timeout')), 120000);
				});
				buffer = await Promise.race([
					workbook.xlsx.writeBuffer(),
					timeoutPromise
				]);
				console.log('[export] writeBuffer 完成，buffer大小:', buffer.length);
			} catch (writeErr) {
				console.error('[export] writeBuffer 失败:', writeErr);
				return { code: 500, msg: '导出失败：文件生成超时' };
			}

			// 写入临时文件后上传，使用固定的带有 uid 的文件名，以便覆盖旧文件，防止云存储空间不断增加
			const cloudPath = `export/服务单汇总_${uid}.xlsx`;
			const uploadRes = await uniCloud.uploadFile({
				fileContent: buffer,
				cloudPath: cloudPath,
				cloudPathAsRealPath: true
			});
			console.log(`[export] 文件已上传至云存储: ${uploadRes.fileID}`);

			// 转换为可访问的 HTTP URL
			const urlRes = await uniCloud.getTempFileURL({
				fileList: [uploadRes.fileID]
			});
			const url = urlRes.fileList[0]?.tempFileURL || uploadRes.fileID;

			return {
				code: 0,
				fileName: cloudPath.split('/').pop(),
				url
			};
		}
		// ========== xlsx 分支结束 ==========

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