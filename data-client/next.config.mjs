const allowedOrigins = {
development: ["http://localhost:1337", "http://localhost:5173", "http://127.0.0.1:1337", "http://127.0.0.1:5173"],
production: ["https://673b686ea8b85674a05f21e1.webflow-ext.com"],
test: ["http://localhost:1337", "http://localhost:5173", "http://127.0.0.1:1337", "http://127.0.0.1:5173"],
};

const nextConfig = {
async headers() {
    const currentEnv = process.env.NODE_ENV || 'development';
    
    return [
    {
        source: "/api/:path*",
        headers: [
        { key: "Access-Control-Allow-Credentials", value: "true" },
        {
            key: "Access-Control-Allow-Origin",
            value: allowedOrigins[currentEnv]?.[0] || "*", // Use the first allowed origin or fallback to wildcard
        },
        {
            key: "Access-Control-Allow-Methods",
            value: "GET, POST, PUT, DELETE, OPTIONS",
        },
        {
            key: "Access-Control-Allow-Headers",
            value:
            "X-CSRF-Token, X-Requested-With, Authorization, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version",
        },
        ],
    },
    ];
},

async rewrites() {
    return [
    {
        source: "/api/:path*",
        destination: "/api/:path*",
    },
    ];
},

eslint: {
    ignoreDuringBuilds: true,
},
};

export default nextConfig;

