<template>
	<view class="container">
		<!-- Search/Filter Header -->
		<view class="filter-header">
			<view class="filter-toggle" @click="showFilter = !showFilter">
				<text>🔍 {{ isAdmin ? '高级查询' : '日期筛选' }}</text>
				<text>{{ showFilter ? '▲' : '▼' }}</text>
			</view>
			
			<view v-if="showFilter" class="filter-panel">
				<view class="filter-row">
					<text class="label">日期范围:</text>
					<view class="date-picker-group">
						<picker mode="date" :value="filter.startDate" @change="bindStartDateChange">
							<view class="picker-input">{{ filter.startDate || '开始日期' }}</view>
						</picker>
						<text class="separator">-</text>
						<picker mode="date" :value="filter.endDate" @change="bindEndDateChange">
							<view class="picker-input">{{ filter.endDate || '结束日期' }}</view>
						</picker>
					</view>
				</view>
				<view class="filter-row" v-if="isAdmin">
					<input class="input" v-model="filter.customerName" placeholder="客户姓名" />
					<input class="input" v-model="filter.customerPhone" placeholder="客户手机号" />
				</view>
				<view class="filter-row" v-if="isAdmin">
					<input class="input" v-model="filter.reporterName" placeholder="报单人姓名" />
					<input class="input" v-model="filter.productModel" placeholder="产品型号" />
				</view>
				<view class="filter-actions">
					<button class="btn reset" size="mini" @click="resetFilter">重置</button>
					<button class="btn search" size="mini" type="primary" @click="doSearch">查询</button>
				</view>
			</view>
		</view>
		
		<view class="order-list">
			<view class="order-item" v-for="(item, index) in list" :key="index" @click="goToDetail(item)">
				<view class="order-header">
					<text class="order-no">{{ item.orderNo }}</text>
					<text class="status-tag">已提交</text>
				</view>
				<view class="order-content">
					<view class="row"><text class="label">客户姓名：</text>{{ item.customerName }}</view>
					<view class="row"><text class="label">服务类型：</text>{{ item.serviceType }}</view>
					<view class="row"><text class="label">机器编号：</text>{{ item.machineNo }}</view>
					<view class="row"><text class="label">提交时间：</text>{{ item.submitTime }}</view>
					<view class="row" v-if="isAdmin && item.reporterName"><text class="label">报单人：</text>{{ item.reporterName }}</view>
				</view>
			</view>
		</view>
		
		<view v-if="list.length === 0" class="empty-state">
			<text>暂无工单记录</text>
		</view>
		
		<!-- Floating Export Button -->
		<view class="fab-export" v-if="isAdmin && list.length > 0" @click.stop="exportData">
			<text class="icon">📥</text>
			<text class="text">导出汇总</text>
		</view>
	</view>
</template>

<script>
	export default {
		data() {
			return {
				list: [],
				isLoading: false,
				showFilter: false,
				isAdmin: false,
				filter: {
					startDate: '',
					endDate: '',
					customerName: '',
					customerPhone: '',
					reporterName: '',
					productModel: ''
				}
			}
		},
		onShow() {
			this.checkRole();
			// Initialize dates if empty
			if (!this.filter.startDate) {
				this.resetFilter(); // Sets default dates
			}
			this.loadData();
		},
		methods: {
			checkRole() {
				const userInfo = uni.getStorageSync('userInfo');
				if (userInfo && userInfo.role) {
					this.isAdmin = userInfo.role.includes('admin');
				} else {
					this.isAdmin = false;
				}
				
				uni.setNavigationBarTitle({
					title: this.isAdmin ? '工单查询' : '我的工单'
				});
			},
			bindStartDateChange(e) {
				this.filter.startDate = e.detail.value;
			},
			bindEndDateChange(e) {
				this.filter.endDate = e.detail.value;
			},
			resetFilter() {
				const end = new Date();
				const start = new Date();
				start.setMonth(start.getMonth() - 1);
				
				this.filter = {
					startDate: this.formatDateSimple(start),
					endDate: this.formatDateSimple(end),
					customerName: '',
					customerPhone: '',
					reporterName: '',
					productModel: ''
				};
			},
			doSearch() {
				this.loadData();
			},
			loadData() {
				this.isLoading = true;
				
				// Prepare params
				const params = {};
				if (this.filter.startDate) {
					params.startDate = new Date(this.filter.startDate + 'T00:00:00').getTime();
				}
				if (this.filter.endDate) {
					params.endDate = new Date(this.filter.endDate + 'T23:59:59').getTime();
				}
				
				// Only add advanced filters if Admin
				if (this.isAdmin) {
					if (this.filter.customerName) params.customerName = this.filter.customerName;
					if (this.filter.customerPhone) params.customerPhone = this.filter.customerPhone;
					if (this.filter.reporterName) params.reporterName = this.filter.reporterName;
					if (this.filter.productModel) params.productModel = this.filter.productModel;
				}
				
				uniCloud.callFunction({
					name: 'work-order-manager',
					data: {
						action: 'list',
						uniIdToken: uni.getStorageSync('uni_id_token'),
						params: params
					},
					success: (res) => {
						this.isLoading = false;
						if (res.result.code === 0) {
							// Transform data for display and export
							this.list = res.result.data.map(item => {
								const c = item.customer || {};
								const p = item.product || {};
								const s = item.service || {};
								
								// Process parts list into a readable string
								const partsStr = (s.parts || []).map(pt => {
									let str = `${pt.name}(${pt.code})x${pt.count} 旧件:${pt.oldPartAction || '未知'} 来源:${pt.source || '未知'}`;
									if (pt.sourceRemark) str += `(${pt.sourceRemark})`;
									if (s.isChargeable === '收费') {
										str += ` 单价:${pt.price || 0} 小计:${pt.total || 0}`;
									}
									return str;
								}).join('; ');
								
								const af = item.additionalFees || {};
								const isChargeable = s.isChargeable || '免费';
								const partsTotal = (s.parts || []).reduce((sum, p) => sum + (p.total || 0), 0);
								const travelFeeTotal = af.travelFee?.total || 0;
								const laborFeeTotal = af.laborFee?.total || 0;
								const grandTotal = af.totalAmount ? (af.totalAmount + partsTotal) : partsTotal;
								
								return {
									id: item._id,
									orderNo: item.orderNo,
									reporterName: item.reporterName || '未知',
									submitTime: this.formatDate(item.create_date),
									
									// Customer
									distributorName: c.distributorName || '-',
									customerName: c.name || '未知',
									customerPhone: c.phone || '-',
									customerAddress: c.address || '-',
									usageType: c.usageType || '-',
									reportTime: this.formatDate(c.reportTime),
									
									// Product
									productModel: p.model || '-',
									machineNo: p.machineNo || '-',
									engineNo: p.engineNo || '-',
									productionDate: this.formatDateSimple(new Date(p.productionDate)),
									
									// Service
									serviceType: s.type || '未知',
									isChargeable: isChargeable,
									paymentMethod: s.paymentMethod || '-',
									partsTotal: partsTotal.toFixed(1),
									travelFeeTotal: travelFeeTotal.toFixed(1),
									laborFeeTotal: laborFeeTotal.toFixed(1),
									grandTotal: grandTotal.toFixed(1),
									faultCategory: s.faultCategory || '-',
									faultDesc: s.faultDesc || '-',
									handleDesc: s.handleDesc || '-',
									partsInfo: partsStr || '无',
									finishTime: this.formatDate(s.finishTime),
									
									// Image IDs for export
									platePhoto: p.platePhoto,
									sitePhotos: s.sitePhotos || [],
									machineUserPhoto: item.customerConfirm?.machineUserPhoto
								};
							});
						} else {
							uni.showToast({ title: '加载失败', icon: 'none' });
						}
					},
					fail: (err) => {
						this.isLoading = false;
						console.error(err);
						uni.showToast({ title: '网络错误', icon: 'none' });
					}
				});
			},
			async exportData() {
				if (this.list.length === 0) return;
				
				uni.showLoading({ title: '正在获取图片链接...' });
				
				// 1. Collect all image IDs
				let allFileIds = [];
				this.list.forEach(item => {
					if (item.platePhoto) allFileIds.push(item.platePhoto);
					if (item.machineUserPhoto) allFileIds.push(item.machineUserPhoto);
					if (item.sitePhotos && item.sitePhotos.length > 0) {
						allFileIds = allFileIds.concat(item.sitePhotos);
					}
				});
				
				// 2. Convert Cloud IDs to HTTP URLs
				let urlMap = {};
				if (allFileIds.length > 0) {
					try {
						const res = await uniCloud.getTempFileURL({
							fileList: allFileIds
						});
						// Debug log
						console.log('getTempFileURL result:', res);
						
						res.fileList.forEach(file => {
							// Check if tempFileURL exists (Aliyun/Tencent compatibility)
							if (file.tempFileURL) {
								urlMap[file.fileID] = file.tempFileURL;
							}
						});
					} catch (e) {
						console.error('获取链接失败', e);
						uni.showToast({ title: '图片链接获取失败', icon: 'none' });
					}
				}
				
				uni.showLoading({ title: '正在生成表格...' });
				
				// Helper to escape XML special characters
				const escapeXml = (str) => {
					if (!str) return '';
					return String(str)
						.replace(/&/g, '&amp;')
						.replace(/</g, '&lt;')
						.replace(/>/g, '&gt;')
						.replace(/"/g, '&quot;')
						.replace(/'/g, '&apos;');
				};
				
				// Excel 2003 XML Template Header
				let xmlContent = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <Worksheet ss:Name="工单汇总">
  <Table>
   <Row>
    <Cell><Data ss:Type="String">派工单号</Data></Cell>
    <Cell><Data ss:Type="String">报单人</Data></Cell>
    <Cell><Data ss:Type="String">提交时间</Data></Cell>
    <Cell><Data ss:Type="String">经销商名称</Data></Cell>
    <Cell><Data ss:Type="String">客户姓名</Data></Cell>
    <Cell><Data ss:Type="String">客户电话</Data></Cell>
    <Cell><Data ss:Type="String">客户地址</Data></Cell>
    <Cell><Data ss:Type="String">农机用途</Data></Cell>
    <Cell><Data ss:Type="String">报修时间</Data></Cell>
    <Cell><Data ss:Type="String">产品型号</Data></Cell>
    <Cell><Data ss:Type="String">机器编号</Data></Cell>
    <Cell><Data ss:Type="String">发动机号</Data></Cell>
    <Cell><Data ss:Type="String">生产日期</Data></Cell>
    <Cell><Data ss:Type="String">服务类型</Data></Cell>
    <Cell><Data ss:Type="String">是否收费</Data></Cell>
    <Cell><Data ss:Type="String">故障分类</Data></Cell>
    <Cell><Data ss:Type="String">故障现象</Data></Cell>
    <Cell><Data ss:Type="String">处理方法</Data></Cell>
    <Cell><Data ss:Type="String">更换零件</Data></Cell>
    <Cell><Data ss:Type="String">维修完成时间</Data></Cell>
    <Cell><Data ss:Type="String">零件费</Data></Cell>
    <Cell><Data ss:Type="String">路程费</Data></Cell>
    <Cell><Data ss:Type="String">工时费</Data></Cell>
    <Cell><Data ss:Type="String">总应收(元)</Data></Cell>
    <Cell><Data ss:Type="String">支付方式</Data></Cell>
    <Cell><Data ss:Type="String">铭牌照片链接</Data></Cell>
    <Cell><Data ss:Type="String">现场照片链接</Data></Cell>
    <Cell><Data ss:Type="String">人机合影链接</Data></Cell>
   </Row>`;
				
				// Rows
				this.list.forEach(item => {
					const plateUrl = urlMap[item.platePhoto] || '-';
					const confirmUrl = urlMap[item.machineUserPhoto] || '-';
					const siteUrls = (item.sitePhotos || []).map(fid => urlMap[fid]).filter(u => u).join(' ; ');

					xmlContent += `
   <Row>
    <Cell><Data ss:Type="String">${escapeXml(item.orderNo)}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(item.reporterName)}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(item.submitTime)}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(item.distributorName)}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(item.customerName)}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(item.customerPhone)}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(item.customerAddress)}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(item.usageType)}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(item.reportTime)}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(item.productModel)}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(item.machineNo)}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(item.engineNo)}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(item.productionDate)}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(item.serviceType)}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(item.isChargeable)}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(item.faultCategory)}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(item.faultDesc)}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(item.handleDesc)}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(item.partsInfo)}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(item.finishTime)}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(item.partsTotal)}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(item.travelFeeTotal)}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(item.laborFeeTotal)}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(item.grandTotal)}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(item.paymentMethod)}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(plateUrl)}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(siteUrls)}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(confirmUrl)}</Data></Cell>
   </Row>`;
				});
				
				// Footer
				xmlContent += `
  </Table>
 </Worksheet>
</Workbook>`;
				
				// Use FileSystemManager to save file
				const fs = uni.getFileSystemManager();
				// Use .xls extension for compatibility with wx.openDocument
				const fileName = `工单汇总_${this.formatDateSimple(new Date())}.xls`;
				const filePath = `${wx.env.USER_DATA_PATH}/${fileName}`;
				
				fs.writeFile({
					filePath: filePath,
					data: xmlContent,
					encoding: 'utf8',
					success: () => {
						uni.hideLoading();
						uni.openDocument({
							filePath: filePath,
							fileType: 'xls', // Explicitly set fileType
							showMenu: true,
							success: function () {
								console.log('打开文档成功');
							},
							fail: function(e) {
								console.error(e);
								uni.showToast({ title: '打开文档失败', icon: 'none' });
							}
						});
					},
					fail: (err) => {
						uni.hideLoading();
						console.error(err);
						uni.showToast({ title: '导出失败', icon: 'none' });
					}
				});
			},
			formatDateSimple(date) {
				const y = date.getFullYear();
				const m = (date.getMonth() + 1).toString().padStart(2, '0');
				const d = date.getDate().toString().padStart(2, '0');
				return `${y}-${m}-${d}`;
			},
			formatDate(ts) {
				if (!ts) return '';
				const d = new Date(ts);
				const y = d.getFullYear();
				const m = (d.getMonth() + 1).toString().padStart(2, '0');
				const date = d.getDate().toString().padStart(2, '0');
				const h = d.getHours().toString().padStart(2, '0');
				const min = d.getMinutes().toString().padStart(2, '0');
				return `${y}-${m}-${date} ${h}:${min}`;
			},
			goToDetail(item) {
				uni.navigateTo({
					url: `/pages/work-order/detail?id=${item.id}`
				});
			}
		}
	}
</script>

<style lang="scss">
	.container {
		padding: 15px;
		background-color: #f5f5f5;
		min-height: 100vh;
		padding-bottom: 80px; /* Space for FAB */
	}
	
	.fab-export {
		position: fixed;
		bottom: 30px;
		right: 20px;
		background-color: #007aff;
		color: #fff;
		border-radius: 50px;
		padding: 10px 20px;
		display: flex;
		align-items: center;
		box-shadow: 0 4px 10px rgba(0,0,0,0.3);
		z-index: 100;
		
		.icon {
			margin-right: 5px;
			font-size: 18px;
		}
		
		.text {
			font-size: 14px;
			font-weight: bold;
		}
		
		&:active {
			opacity: 0.9;
			transform: scale(0.98);
		}
	}
	
	.filter-header {
		background: #fff;
		border-radius: 8px;
		padding: 10px;
		margin-bottom: 15px;
		box-shadow: 0 1px 3px rgba(0,0,0,0.1);
		
		.filter-toggle {
			display: flex;
			justify-content: space-between;
			align-items: center;
			font-weight: bold;
			color: #333;
		}
		
		.filter-panel {
			margin-top: 15px;
			border-top: 1px solid #eee;
			padding-top: 10px;
			
			.filter-row {
				display: flex;
				align-items: center;
				margin-bottom: 10px;
				gap: 10px;
				
				.label {
					font-size: 14px;
					color: #666;
					width: 70px;
				}
				
				.input {
					flex: 1;
					border: 1px solid #ddd;
					border-radius: 4px;
					padding: 6px 10px;
					font-size: 14px;
				}
				
				.date-picker-group {
					flex: 1;
					display: flex;
					align-items: center;
					
					.picker-input {
						border: 1px solid #ddd;
						border-radius: 4px;
						padding: 6px 10px;
						font-size: 14px;
						min-width: 90px;
						text-align: center;
					}
					
					.separator {
						margin: 0 5px;
						color: #999;
					}
				}
			}
			
			.filter-actions {
				display: flex;
				justify-content: flex-end;
				gap: 10px;
				margin-top: 10px;
				
				.btn {
					margin: 0;
				}
			}
		}
	}
	
	.order-item {
		background: #fff;
		border-radius: 8px;
		padding: 15px;
		margin-bottom: 15px;
		box-shadow: 0 1px 3px rgba(0,0,0,0.1);
		
		.order-header {
			display: flex;
			justify-content: space-between;
			border-bottom: 1px solid #eee;
			padding-bottom: 10px;
			margin-bottom: 10px;
			
			.order-no {
				font-weight: bold;
				color: #333;
			}
			
			.status-tag {
				font-size: 12px;
				color: #4caf50;
				background: #e8f5e9;
				padding: 2px 6px;
				border-radius: 4px;
			}
		}
		
		.order-content {
			.row {
				font-size: 14px;
				color: #666;
				margin-bottom: 5px;
				
				.label {
					color: #999;
					margin-right: 5px;
				}
			}
		}
	}
	
	.empty-state {
		text-align: center;
		margin-top: 50px;
		color: #999;
	}
</style>