<template>
	<view class="container">
		<view class="title">隐私政策</view>
		<view class="content">
			<view class="paragraph">
				感谢您使用玖顺农机售后服务。我们深知个人信息对您的重要性，并致力于保护您的隐私及个人信息的安全。本政策将详细说明我们如何收集、使用、存储及保护您的个人信息，以及您如何管理这些信息。
			</view>
			<view class="section-title">一、 我们如何收集和使用您的个人信息</view>
			<view class="paragraph">
				1. 注册账号并实名认证：当您在申请使用本小程序的售后服务和派单功能时，我们将收集您的<b>真实姓名、手机号码</b>。此信息用于识别您的身份，作为本平台内部派单、人员分配及业务沟通的核心标识。
			</view>
			<view class="paragraph">
				2. 业务功能及设备信息：为保障软件运行的稳定与安全，我们可能会自动接收并记录您的设备相关信息（例如设备型号、操作系统版本）。
			</view>
			<view class="section-title">二、 我们如何存储您的个人信息</view>
			<view class="paragraph">
				1. 存储位置：我们会按照相关法律法规的规定，将收集到的中华人民共和国境内的用户个人信息存储在中国境内服务器上。
			</view>
			<view class="paragraph">
				2. 存储时间：我们将仅在为您提供服务所必需的期限内存储您的个人信息。超出必要期限后，我们将对您的个人信息进行删除或匿名化处理。
			</view>
			<view class="section-title">三、 我们如何共享您的个人信息</view>
			<view class="paragraph">
				除以下情形外，我们不会与任何第三方共享您的个人信息：
				1. 获得您明确的同意或授权；
				2. 为履行法定职责或法定义务所必需的；
				3. 涉及服务执行派单所需的人员调度，会将相关信息发送至售后服务人员。
			</view>
			<view class="section-title">四、 如何联系我们</view>
			<view class="paragraph">
				如果您对本政策有任何疑问、意见或建议，可以通过小程序内的客服反馈渠道与我们联系。我们将尽快审核所涉问题，并在验证您的用户身份后予以回复。
			</view>
		</view>
	</view>
</template>

<script>
	export default {
		data() {
			return {
				
			}
		},
		methods: {
			
		}
	}
</script>

<style>
	.container {
		padding: 20px;
		background-color: #ffffff;
		min-height: 100vh;
	}
	.title {
		font-size: 20px;
		font-weight: bold;
		text-align: center;
		margin-bottom: 20px;
	}
	.section-title {
		font-size: 16px;
		font-weight: bold;
		margin-top: 15px;
		margin-bottom: 10px;
		color: #333;
	}
	.content {
		font-size: 14px;
		color: #666;
		line-height: 1.6;
	}
	.paragraph {
		margin-bottom: 10px;
		text-align: justify;
	}
</style>
