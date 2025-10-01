# Tailwind CSS v4 Setup with NativeWind v5

This project is configured with **Tailwind CSS v4.1.13** and **NativeWind v5.0.0-preview.1** for styling React Native components using Tailwind utility classes.

## 📦 Installed Packages

- `tailwindcss@^4.1.13` - Tailwind CSS v4
- `nativewind@^5.0.0-preview.1` - NativeWind v5 (supports Tailwind v4)
- `lightningcss@^1.30.2` - Fast CSS parser required by NativeWind v5
- `react-native-css@^3.0.0` - CSS support for React Native

## ⚙️ Configuration Files

### 1. `tailwind.config.js`
Standard Tailwind v4 configuration without presets (NativeWind v5 doesn't need the preset).

### 2. `global.css`
Uses the new Tailwind v4 import syntax:
```css
@import "tailwindcss";
```

### 3. `metro.config.js`
Configured to support CSS files:
```js
config.resolver.sourceExts = [...(config.resolver?.sourceExts ?? []), 'css'];
```

### 4. `babel.config.js`
Standard Expo preset configuration (no special NativeWind config needed):
```js
presets: ['babel-preset-expo']
```
**Note:** Do NOT add `jsxImportSource: 'nativewind'` as it causes module resolution errors in NativeWind v5 preview.

### 5. `app/_layout.tsx`
Imports global styles at the top:
```tsx
import '../global.css';
```

### 6. `nativewind-env.d.ts`
TypeScript definitions for NativeWind className prop.

### 7. `tsconfig.json`
Includes `nativewind-env.d.ts` for TypeScript support.

## 🚀 Usage

Use Tailwind utility classes with the `className` prop on any React Native component:

```tsx
import { View, Text } from 'react-native';

export function MyComponent() {
  return (
    <View className="flex-1 items-center justify-center bg-blue-500 p-4">
      <Text className="text-white text-2xl font-bold">
        Hello Tailwind v4!
      </Text>
      <View className="mt-4 bg-white rounded-lg p-4 shadow-lg">
        <Text className="text-gray-800">
          This uses Tailwind CSS v4 utilities
        </Text>
      </View>
    </View>
  );
}
```

## 🎨 Example Component

Check out [components/TailwindTest.tsx](components/TailwindTest.tsx) for a comprehensive example demonstrating various Tailwind utilities.

## 🔥 Features

- ✅ **Tailwind CSS v4.1.13** - Latest version with new features
- ✅ **NativeWind v5 Preview** - Full Tailwind v4 support
- ✅ **TypeScript Support** - Full type safety for className prop
- ✅ **Hot Reload** - Instant updates during development
- ✅ **All Tailwind Utilities** - Colors, spacing, flexbox, typography, etc.
- ✅ **Custom Utilities** - Opacity modifiers (e.g., `bg-white/10`)
- ✅ **Responsive Design** - Tailwind's responsive utilities work seamlessly

## 🛠️ Development

Start the development server:
```bash
npm start
```

Clear cache and restart:
```bash
npm start -- --clear
```

## ⚠️ Important Notes

1. **NativeWind v5 is in Preview** - This is a preview release. Some features may change.
2. **Node.js Warning** - You might see a warning about Node.js version for `tailwindcss-safe-area`. This can be ignored.
3. **No Preset Needed** - NativeWind v5 doesn't require the preset in `tailwind.config.js`
4. **New Import Syntax** - Use `@import "tailwindcss";` instead of `@tailwind` directives

## 📚 Resources

- [Tailwind CSS v4 Documentation](https://tailwindcss.com)
- [NativeWind Documentation](https://nativewind.dev)
- [NativeWind v5 Migration Guide](https://github.com/nativewind/nativewind)

## 🐛 Troubleshooting

If you encounter issues:

1. Clear all caches:
   ```bash
   rm -rf node_modules/.cache .expo
   npm start -- --clear
   ```

2. Verify package versions:
   ```bash
   npm list tailwindcss nativewind
   ```

3. Check that `global.css` is imported in `app/_layout.tsx`

4. Ensure `babel.config.js` does NOT have `jsxImportSource` (causes errors with NativeWind v5)
