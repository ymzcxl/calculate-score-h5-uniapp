<script>
	export default {
		onLaunch: function() {
			console.log('App Launch')
		},
		onShow: function() {
			console.log('App Show')
		},
		onHide: function() {
			console.log('App Hide')
		}
	}
</script>

<style lang="scss">
	/*每个页面公共css */
	@import "uni.scss";
	@import "uview-plus/index.scss";
	
	/* 全局动画效果 */
	@keyframes fadeIn {
		from {
			opacity: 0;
			transform: translateY(20rpx);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
	
	@keyframes slideUp {
		from {
			opacity: 0;
			transform: translateY(50rpx) scale(0.95);
		}
		to {
			opacity: 1;
			transform: translateY(0) scale(1);
		}
	}
	
	@keyframes slideIn {
		from {
			opacity: 0;
			transform: translateX(-20rpx);
		}
		to {
			opacity: 1;
			transform: translateX(0);
		}
	}
	
	@keyframes pulse {
		0% {
			transform: scale(1);
		}
		50% {
			transform: scale(1.05);
		}
		100% {
			transform: scale(1);
		}
	}
	
	@keyframes bounce {
		0%, 20%, 50%, 80%, 100% {
			transform: translateY(0);
		}
		40% {
			transform: translateY(-20rpx);
		}
		60% {
			transform: translateY(-10rpx);
		}
	}
	
	@keyframes float {
		0% {
			transform: translate(0, 0) rotate(0deg);
		}
		50% {
			transform: translate(10%, 10%) rotate(180deg);
		}
		100% {
			transform: translate(0, 0) rotate(360deg);
		}
	}
	
	/* 全局过渡效果 */
	.page-enter-active,
	.page-leave-active {
		transition: all 0.3s ease;
	}
	
	.page-enter-from {
		opacity: 0;
		transform: translateX(100%);
	}
	
	.page-leave-to {
		opacity: 0;
		transform: translateX(-100%);
	}
	
	/* 全局按钮样式 */
	button {
		transition: all 0.3s ease;
	}
	
	button:hover {
		transform: translateY(-2rpx);
	}
	
	/* 全局滚动条样式 */
	::-webkit-scrollbar {
		width: 6rpx;
		height: 6rpx;
	}
	
	::-webkit-scrollbar-track {
		background: $uni-bg-color-grey;
		border-radius: $uni-border-radius-full;
	}
	
	::-webkit-scrollbar-thumb {
		background: $uni-border-color;
		border-radius: $uni-border-radius-full;
	}
	
	::-webkit-scrollbar-thumb:hover {
		background: $uni-border-color-dark;
	}

	/* 全局容器样式 */
	.container {
		width: 100%;
		max-width: 750rpx;
		margin: 0 auto;
		padding: 20rpx;
		box-sizing: border-box;
	}

	/* 卡片样式 */
	.card {
		background: $uni-bg-color;
		border-radius: $uni-border-radius-lg;
		box-shadow: $uni-shadow-sm;
		padding: 24rpx;
		margin-bottom: 20rpx;
		transition: all 0.3s ease;
	}

	.card:hover {
		box-shadow: $uni-shadow-md;
		transform: translateY(-2rpx);
	}

	/* 按钮样式优化 */
	.btn-primary {
		background: $uni-color-primary;
		color: $uni-text-color-inverse;
		border: none;
		border-radius: $uni-border-radius-base;
		padding: 16rpx 32rpx;
		font-size: $uni-font-size-base;
		font-weight: 500;
		transition: all 0.3s ease;
	}

	.btn-primary:hover {
		background: $uni-color-primary-dark;
		transform: translateY(-2rpx);
		box-shadow: $uni-shadow-sm;
	}

	.btn-secondary {
		background: $uni-bg-color;
		color: $uni-color-primary;
		border: 1rpx solid $uni-color-primary;
		border-radius: $uni-border-radius-base;
		padding: 16rpx 32rpx;
		font-size: $uni-font-size-base;
		transition: all 0.3s ease;
	}

	.btn-secondary:hover {
		background: rgba($uni-color-primary, 0.05);
		transform: translateY(-2rpx);
	}

	/* 输入框样式优化 */
	.input {
		width: 100%;
		padding: 16rpx 20rpx;
		border: 1rpx solid $uni-border-color;
		border-radius: $uni-border-radius-base;
		font-size: $uni-font-size-base;
		transition: all 0.3s ease;
		box-sizing: border-box;
	}

	.input:focus {
		outline: none;
		border-color: $uni-color-primary;
		box-shadow: 0 0 0 3rpx rgba($uni-color-primary, 0.1);
	}

	/* 标题样式 */
	.title {
		font-size: $uni-font-size-title;
		font-weight: 600;
		color: $uni-text-color;
		margin-bottom: 20rpx;
		text-align: center;
	}

	.subtitle {
		font-size: $uni-font-size-lg;
		font-weight: 500;
		color: $uni-text-color;
		margin-bottom: 16rpx;
	}

	/* 文本居中 */
	.text-center {
		text-align: center;
	}

	/* 弹性布局 */
	.flex {
		display: flex;
	}

	.flex-center {
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.flex-between {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.flex-column {
		display: flex;
		flex-direction: column;
	}

	/* 间距 */
	.mt-10 {
		margin-top: 10rpx;
	}

	.mt-20 {
		margin-top: 20rpx;
	}

	.mb-10 {
		margin-bottom: 10rpx;
	}

	.mb-20 {
		margin-bottom: 20rpx;
	}

	.mx-auto {
		margin-left: auto;
		margin-right: auto;
	}

	/* 响应式设计 */
	@media screen and (max-width: 750rpx) {
		.container {
			padding: 16rpx;
		}

		.card {
			padding: 20rpx;
		}
	}
</style>
