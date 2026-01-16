'use strict';
const uniID = require('uni-id-common')
const db = uniCloud.database()

exports.main = async (event, context) => {
	const uniIdIns = uniID.createInstance({
		context
	})
	
	const adminMobile = '13800000000';
	const adminPassword = 'admin123456'; // Default password
	
	// 1. Check if user exists
	const { total } = await db.collection('uni-id-users').where({
		mobile: adminMobile
	}).count()
	
	if (total > 0) {
		return {
			code: 0,
			msg: 'Admin user already exists.'
		}
	}
	
	// 2. Register Admin
	const res = await uniIdIns.register({
		username: 'admin',
		mobile: adminMobile,
		password: adminPassword,
		role: ['admin', '玖顺员工'],
		nickname: '超级管理员'
	})
	
	if (res.code === 0) {
		return {
			code: 0,
			msg: `Admin created successfully. Mobile: ${adminMobile}, Password: ${adminPassword}`
		}
	} else {
		return res
	}
};