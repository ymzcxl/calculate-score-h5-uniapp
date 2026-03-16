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
	/* uview-plus 必要变量定义 */
	$u-border-color: #e5e7eb;
	$u-primary: #4facfe;
	$u-primary-light: #00f2fe;
	$u-primary-dark: #3a86ff;
	$u-primary-disabled: rgba(#4facfe, 0.5);
	$u-success: #10b981;
	$u-success-light: rgba(#10b981, 0.1);
	$u-success-dark: #059669;
	$u-success-disabled: rgba(#10b981, 0.5);
	$u-warning: #f59e0b;
	$u-warning-light: rgba(#f59e0b, 0.1);
	$u-warning-dark: #d97706;
	$u-warning-disabled: rgba(#f59e0b, 0.5);
	$u-error: #ef4444;
	$u-error-light: rgba(#ef4444, 0.1);
	$u-error-dark: #dc2626;
	$u-error-disabled: rgba(#ef4444, 0.5);
	$u-info: #3b82f6;
	$u-info-light: rgba(#3b82f6, 0.1);
	$u-info-dark: #2563eb;
	$u-info-disabled: rgba(#3b82f6, 0.5);
	$u-main-color: #333;
	$u-content-color: #666;
	$u-tips-color: #999;
	$u-light-color: #f5f5f5;
	
	/*每个页面公共css */
	@import "uview-plus/index.scss";
	@import "uni.scss";
	
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
</style>
