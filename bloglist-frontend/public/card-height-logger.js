// 监听DOM加载完成
document.addEventListener('DOMContentLoaded', () => {
  // 延迟执行，确保页面完全渲染
  setTimeout(() => {
    // 修改选择器，针对页面上实际显示的卡片元素
    const cardSelectors = [
      '.article-card',       // 在 home/index.tsx 中使用
      'article',             // 大多数博客文章使用
      '.ant-card',           // 管理后台使用
      '.bg-gray-800',        // 在 UserPage.tsx 中使用
      '.bg-gradient-to-br',  // 可能的卡片背景类
      '.mb-10',              // BlogPost 的 margin-bottom 类
      '.mb-8',               // SimpleBlogPost 的 margin-bottom 类
      'div[style*="backgroundColor"]' // 内联样式卡片
    ];
    
    let allCards = [];
    
    // 尝试每个选择器
    cardSelectors.forEach(selector => {
      try {
        const cards = document.querySelectorAll(selector);
        if (cards.length > 0) {
          cards.forEach(card => {
            allCards.push({ element: card, selector });
          });
        }
      } catch (error) {
        console.warn(`选择器 ${selector} 执行失败:`, error.message);
      }
    });
    
    // 查找包含特定文本的元素（使用标准DOM方法）
    try {
      const allDivs = document.querySelectorAll('div:not(.root)');
      const elasticsearchCards = Array.from(allDivs).filter(div => 
        div.textContent && div.textContent.includes('Elasticsearch')
      );
      
      if (elasticsearchCards.length > 0) {
        console.log(`找到 ${elasticsearchCards.length} 个包含 "Elasticsearch" 的卡片`);
        elasticsearchCards.forEach((card, idx) => {
          console.log(`Elasticsearch卡片 ${idx + 1}:`, {
            高度: card.clientHeight,
            宽度: card.clientWidth,
            类名: card.className
          });
        });
      }
    } catch (error) {
      console.warn('处理Elasticsearch卡片时出错:', error.message);
    }
    
    if (allCards.length === 0) {
      console.log('未找到匹配的卡片元素，尝试检测页面中的大容器');
      
      // 遍历所有元素，寻找可能的卡片
      document.querySelectorAll('div, article, section').forEach(el => {
        if (el.clientHeight > 100 && el.clientWidth > 200) {
          // 检查元素是否包含博客文章特征
          const hasTitleElement = el.querySelector('h1, h2, h3');
          const hasDateElement = el.querySelector('time') || 
                                (el.textContent && el.textContent.includes('2025'));
          const hasContent = el.textContent && el.textContent.length > 100;
          
          if ((hasTitleElement || hasDateElement) && hasContent) {
            console.log('可能的卡片元素:', {
              标签: el.tagName,
              高度: el.clientHeight,
              宽度: el.clientWidth,
              类名: el.className,
              预览: el.textContent ? el.textContent.substring(0, 50).replace(/\n/g, ' ').trim() : '无内容'
            });
          }
        }
      });
    } else {
      // 输出每个卡片的高度
      console.log('找到的卡片信息:');
      allCards.forEach((card, index) => {
        console.log(`卡片 ${index + 1} [${card.selector}]:`, {
          高度: card.element.clientHeight,
          宽度: card.element.clientWidth,
          类名: card.element.className,
          标签: card.element.tagName
        });
      });
    }
    
    // 最后一招：测量页面中所有明显的大容器
    let bigContainers = 0;
    document.querySelectorAll('div, article, section').forEach(el => {
      if (el.clientHeight > 200 && el.clientWidth > 400) {
        bigContainers++;
      }
    });
    
    console.log(`页面检测完成，共找到 ${allCards.length} 个卡片元素，${bigContainers} 个大容器`);
    
  }, 2000); // 增加延迟至2秒，确保页面完全渲染
});

console.log('卡片高度监听器已加载 - 修复CSS选择器错误版本');