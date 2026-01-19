'use strict';
const uniID = require('uni-id-common')
const db = uniCloud.database()
const dbCmd = db.command

exports.main = async (event, context) => {
    const { action, params, uniIdToken } = event
    const uniIdIns = uniID.createInstance({ context })

    // Check Token
    const payload = await uniIdIns.checkToken(uniIdToken)
    if (payload.code !== 0) return payload
    const uid = payload.uid

    // Get User Roles
    const userRes = await db.collection('uni-id-users').doc(uid).get()
    const userRoles = userRes.data[0].role || []
    const isAdmin = userRoles.includes('admin')

    // 1. Create Feedback
    if (action === 'add') {
        const { content, type, images } = params

        const res = await db.collection('jiushun-feedback').add({
            user_id: uid,
            content,
            type: type || 'suggestion',
            images: images || [],
            status: 0,
            create_date: Date.now()
        })

        return { code: 0, msg: '提交成功', id: res.id }
    }

    // 2. List Feedback
    if (action === 'list') {
        const { page = 1, pageSize = 20 } = params
        const skip = (page - 1) * pageSize

        let query = {}
        // If Admin: See all. If User: See own.
        if (!isAdmin) {
            query.user_id = uid
        }

        const totalRes = await db.collection('jiushun-feedback').where(query).count()
        const res = await db.collection('jiushun-feedback')
            .where(query)
            .orderBy('create_date', 'desc')
            .skip(skip)
            .limit(pageSize)
            .get()

        // If Admin, populate user nickname? (Optional optimization, or do in frontend)
        // Let's do a simple lookup if admin, to show who posted
        if (isAdmin && res.data.length > 0) {
            const userIds = res.data.map(i => i.user_id)
            const userMapRes = await db.collection('uni-id-users')
                .where({ _id: dbCmd.in(userIds) })
                .field({ nickname: 1, mobile: 1 })
                .get()

            const userMap = {}
            userMapRes.data.forEach(u => userMap[u._id] = u)

            res.data.forEach(item => {
                const u = userMap[item.user_id]
                if (u) {
                    item.user_name = u.nickname
                    item.user_mobile = u.mobile
                } else {
                    item.user_name = '未知用户'
                }
            })
        }

        return {
            code: 0,
            data: res.data,
            total: totalRes.total
        }
    }

    // 3. Get Detail
    if (action === 'get') {
        const { id } = params
        const res = await db.collection('jiushun-feedback').doc(id).get()

        if (res.data.length === 0) return { code: 404, msg: '不存在' }
        const item = res.data[0]

        // Security Check
        if (!isAdmin && item.user_id !== uid) {
            return { code: 403, msg: '无权查看' }
        }

        // Populate User Info for Admin
        if (isAdmin) {
            const uRes = await db.collection('uni-id-users').doc(item.user_id)
                .field({ nickname: 1, mobile: 1 })
                .get()
            if (uRes.data.length > 0) {
                item.user_name = uRes.data[0].nickname
                item.user_mobile = uRes.data[0].mobile
            }
        }

        // Populate Admin Info for Reply
        if (item.reply && item.reply.admin_uid) {
            const aRes = await db.collection('uni-id-users').doc(item.reply.admin_uid)
                .field({ nickname: 1 })
                .get()
            if (aRes.data.length > 0) {
                item.reply.admin_name = aRes.data[0].nickname
            }
        }

        return { code: 0, data: item }
    }

    // 4. Reply (Admin Only)
    if (action === 'reply') {
        if (!isAdmin) return { code: 403, msg: '无权操作' }

        const { id, content } = params

        await db.collection('jiushun-feedback').doc(id).update({
            status: 1,
            reply: {
                content,
                create_date: Date.now(),
                admin_uid: uid
            }
        })

        return { code: 0, msg: '回复成功' }
    }

    return { code: 404, msg: 'Unknown Action' }
};
