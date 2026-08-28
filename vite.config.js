import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
import {resolve} from 'path';
import fs from 'fs/promises';
import svgr from '@svgr/rollup';
import tailwindcss from '@tailwindcss/vite';
import {visualizer} from 'rollup-plugin-visualizer';
import viteCompression from 'vite-plugin-compression';
// https://vitejs.dev/config/
export default defineConfig({
   base: '/skill-lens/',
    plugins: [
        svgr(),
        tailwindcss(),
        react({
            include: '**/*.{jsx,js}',
            jsxRuntime: 'automatic',
            babel: {
                // plugins: [['babel-plugin-react-compiler', {}]],
            },
        }),
        // Bundle analyzer (similar to webpack bundle analyzer)
        process.env.ANALYZE === 'true' && visualizer({
            filename: 'stats.html',
            open: true,
            gzipSize: true,
            brotliSize: true,
        }),
        // Pre-compress assets (gzip + brotli) only when COMPRESS=true
        process.env.COMPRESS === 'true' && viteCompression({
            algorithm: 'brotliCompress',
            ext: '.br',
            compressionOptions: {level: 11},
            deleteOriginFile: false,
            filter: f => {
                const norm = f.replace(/\\/g, '/').replace(/^\.?\/?(build\/)?/, '');
                const ignored = ['index.html', 'security.js', 'env.js', 'favicon.ico'];
                const isIgnored = ignored.some(name => norm === name || norm.endsWith('/' + name));
                const should = /\.(js|mjs|json|css|html|svg|ico)$/.test(f) && !isIgnored;
                return should;
            },
        }),
        process.env.COMPRESS === 'true' && viteCompression({
            algorithm: 'gzip',
            ext: '.gz',
            deleteOriginFile: true,
            filter: f => {
                const norm = f.replace(/\\/g, '/').replace(/^\.?\/?(build\/)?/, '');
                const ignored = ['index.html', 'security.js', 'env.js', 'favicon.ico'];
                const isIgnored = ignored.some(name => norm === name || norm.endsWith('/' + name));
                const should = /\.(js|mjs|json|css|html|svg|ico)$/.test(f) && !isIgnored;
                return should;
            },
        }),
    ].filter(Boolean),
    resolve: {
        alias: {
            src: resolve(__dirname, 'src'),
        },
        dedupe: ['react', 'react-dom', 'react/jsx-runtime'],
    },
    build: {
        outDir: 'build',
        minify: 'esbuild',
        sourcemap: process.env.ANALYZE === 'true' || process.env.SOURCE_MAPS === '1',
        target: 'es2022',
        cssTarget: ['chrome90', 'edge90', 'firefox90', 'safari15'],
        chunkSizeWarningLimit: 500,
        rollupOptions: {
            output: {
                chunkFileNames: chunk => `assets/${chunk.name === 'index' ? 'main' : chunk.name}-[hash].js`,
                assetFileNames: asset => {
                    const name = asset.names?.[0] ?? asset.name ?? '';
                    const extType = name.split('.').at(-1) ?? '';
                    if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(extType)) return 'assets/images/[name]-[hash].[ext]';
                    if (/woff2?|eot|ttf|otf/i.test(extType)) return 'assets/fonts/[name]-[hash].[ext]';
                    return 'assets/[name]-[hash].[ext]';
                },
                entryFileNames: 'assets/main-[hash].js'
            }
        }
    },
    esbuild: {
        loader: 'jsx',
        include: /src\/.*\.jsx?$/,
        exclude: [],
    },
    optimizeDeps: {
        esbuildOptions: {
            plugins: [
                {
                    name: 'load-js-files-as-jsx',
                    setup(build) {
                        build.onLoad(
                            {filter: /src\\.*\.js$/},
                            async (args) => ({
                                loader: 'jsx',
                                contents: await fs.readFile(args.path, 'utf8'),
                            }),
                        );
                    },
                },
            ],
        },
    },


});
