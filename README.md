# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is enabled on this template. See [this documentation](https://react.dev/learn/react-compiler) for more information.

Note: This will impact Vite dev & build performances.
You can also try [the experimental native React Compiler support in plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md#rust-react-compiler) by using `compiler: true` in the plugin options instead of using the Babel plugin.

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])

```

You can also install [eslint-plugin-react-x](https://npmx.dev/package/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://npmx.dev/package/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])

```


## Carrito y permisos de pedidos

Los roles se leen del access token de CloudNative API: `Cliente` puede leer el
catálogo, añadir al carrito, crear pedidos y consultar sus propios pedidos.
`Admin` puede administrar productos y consultar, editar pedidos CREADO,
cambiar su estado y eliminarlos. Los permisos existentes de `Operador` se
mantienen en el backend. Las rutas administrativas del frontend son para Admin.
Asignar los roles en la aplicación de API de Entra ID; una cuenta sin uno de
estos roles no tiene acceso a la tienda.

El carrito permanece en memoria durante la sesión y se vacía al cambiar de
cuenta o recargar. El número de cliente es una referencia comercial requerida
por la API; la propiedad del pedido depende del emisor y sujeto del token,
nunca de ese número. El backend calcula los precios. Crear pedidos no reserva
ni descuenta inventario.

En desarrollo, Vite dirige `/api/catalog` a localhost:8080 y `/api/v1/orders`
a localhost:8081. En Docker se usa el proxy Nginx existente. Para otra API,
definir `VITE_API_BASE_URL` antes de compilar. Desplegar también los cambios
de ms-orders y ms-catalog para habilitar el rol Cliente.
