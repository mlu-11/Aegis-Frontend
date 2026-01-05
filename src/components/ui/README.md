# CustomDrawer 组件

一个使用 Tailwind CSS 和 React 实现的自定义抽屉组件，用于替代 MUI 的 Drawer。

## 特性

1. **从右侧滑出** - 抽屉从屏幕右侧滑入
2. **不占用全屏** - 抽屉出现后，左侧区域仍然可见和可点击
3. **无遮盖层** - 没有背景遮罩，可以直接点击抽屉外的区域
4. **手动关闭** - 只能通过抽屉内的UI元素手动关闭
5. **流畅动画** - 使用 CSS transitions 实现平滑的滑入滑出效果
6. **样式一致** - 与 MUI Drawer 保持相似的视觉效果

## 使用方法

```tsx
import CustomDrawer from '../ui/CustomDrawer';

function MyComponent() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button onClick={() => setOpen(true)}>
        打开抽屉
      </button>
      
      <CustomDrawer
        open={open}
        onClose={() => setOpen(false)}
        width={400}
      >
        <div className="p-4">
          <h2>抽屉内容</h2>
          <button onClick={() => setOpen(false)}>
            关闭
          </button>
        </div>
      </CustomDrawer>
    </>
  );
}
```

## Props

| 属性 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| `open` | `boolean` | - | 控制抽屉的显示/隐藏 |
| `onClose` | `() => void` | - | 关闭回调函数（需要在抽屉内部手动调用） |
| `children` | `ReactNode` | - | 抽屉内容 |
| `width` | `number` | `400` | 抽屉宽度（像素） |
| `className` | `string` | `''` | 额外的CSS类名 |

## 设计原则

- **非模态行为**: 背景区域完全可交互，没有任何遮盖层
- **明确的关闭操作**: 用户必须通过明确的UI操作（如关闭按钮）来关闭抽屉
- **视觉一致性**: 保持与应用整体设计风格的一致性
- **无干扰**: 抽屉不会阻止用户与背景内容的交互

## 技术实现

- 使用 `createPortal` 将抽屉渲染到 document.body
- 使用 Tailwind CSS 实现样式和动画
- 使用 `pointer-events-none` 和 `pointer-events-auto` 控制点击穿透
- 使用 `useRef` 获取抽屉DOM引用（预留用于未来功能扩展）
- 固定定位在屏幕右侧，不影响背景内容的交互
