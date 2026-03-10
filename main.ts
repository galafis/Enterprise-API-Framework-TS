/**
 * Enterprise API Framework
 * Production-ready REST API framework with middleware pipeline,
 * routing, validation, and plugin architecture.
 * @author Gabriel Demetrios Lafis
 */

// --- Core Types ---

interface HttpRequest {
    method: string;
    path: string;
    params: Record<string, string>;
    query: Record<string, string>;
    body: unknown;
    headers: Record<string, string>;
    context: Record<string, unknown>;
}

interface HttpResponse {
    status: number;
    body: unknown;
    headers: Record<string, string>;
}

type MiddlewareFunction = (req: HttpRequest, res: HttpResponse, next: () => Promise<void>) => Promise<void>;
type RouteHandler = (req: HttpRequest) => Promise<HttpResponse>;

interface RouteDefinition {
    method: string;
    path: string;
    handler: RouteHandler;
    middleware: MiddlewareFunction[];
}

interface PluginConfig {
    name: string;
    version: string;
    initialize: (framework: ApiFramework) => void;
}

interface ValidationRule {
    field: string;
    type: 'string' | 'number' | 'boolean' | 'object' | 'array';
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
    pattern?: string;
}

interface RateLimitConfig {
    windowMs: number;
    maxRequests: number;
}

// --- Middleware Classes ---

class Logger {
    private logs: Array<{ timestamp: string; level: string; message: string; meta?: Record<string, unknown> }> = [];

    log(level: string, message: string, meta?: Record<string, unknown>): void {
        const entry = {
            timestamp: new Date().toISOString(),
            level,
            message,
            meta
        };
        this.logs.push(entry);
        console.log(`[${entry.timestamp}] [${level.toUpperCase()}] ${message}`);
    }

    info(message: string, meta?: Record<string, unknown>): void { this.log('info', message, meta); }
    warn(message: string, meta?: Record<string, unknown>): void { this.log('warn', message, meta); }
    error(message: string, meta?: Record<string, unknown>): void { this.log('error', message, meta); }

    getEntries(): typeof this.logs { return [...this.logs]; }
}

class RateLimiter {
    private requests: Map<string, { count: number; resetAt: number }> = new Map();

    constructor(private config: RateLimitConfig) {}

    check(clientId: string): boolean {
        const now = Date.now();
        const record = this.requests.get(clientId);

        if (!record || now > record.resetAt) {
            this.requests.set(clientId, { count: 1, resetAt: now + this.config.windowMs });
            return true;
        }

        if (record.count >= this.config.maxRequests) {
            return false;
        }

        record.count++;
        return true;
    }

    reset(clientId: string): void {
        this.requests.delete(clientId);
    }
}

class RequestValidator {
    validate(data: unknown, rules: ValidationRule[]): { valid: boolean; errors: string[] } {
        const errors: string[] = [];
        const obj = data as Record<string, unknown>;

        for (const rule of rules) {
            const value = obj?.[rule.field];

            if (rule.required && (value === undefined || value === null)) {
                errors.push(`Field '${rule.field}' is required`);
                continue;
            }

            if (value === undefined || value === null) continue;

            if (typeof value !== rule.type) {
                errors.push(`Field '${rule.field}' must be of type ${rule.type}`);
                continue;
            }

            if (rule.type === 'string') {
                const str = value as string;
                if (rule.minLength && str.length < rule.minLength) {
                    errors.push(`Field '${rule.field}' must have at least ${rule.minLength} characters`);
                }
                if (rule.maxLength && str.length > rule.maxLength) {
                    errors.push(`Field '${rule.field}' must have at most ${rule.maxLength} characters`);
                }
                if (rule.pattern && !new RegExp(rule.pattern).test(str)) {
                    errors.push(`Field '${rule.field}' does not match required pattern`);
                }
            }

            if (rule.type === 'number') {
                const num = value as number;
                if (rule.min !== undefined && num < rule.min) {
                    errors.push(`Field '${rule.field}' must be at least ${rule.min}`);
                }
                if (rule.max !== undefined && num > rule.max) {
                    errors.push(`Field '${rule.field}' must be at most ${rule.max}`);
                }
            }
        }

        return { valid: errors.length === 0, errors };
    }
}

// --- Router ---

class Router {
    private routes: RouteDefinition[] = [];
    private prefix: string;

    constructor(prefix: string = '') {
        this.prefix = prefix;
    }

    private addRoute(method: string, path: string, handler: RouteHandler, middleware: MiddlewareFunction[] = []): void {
        this.routes.push({ method: method.toUpperCase(), path: this.prefix + path, handler, middleware });
    }

    get(path: string, handler: RouteHandler, middleware: MiddlewareFunction[] = []): void {
        this.addRoute('GET', path, handler, middleware);
    }

    post(path: string, handler: RouteHandler, middleware: MiddlewareFunction[] = []): void {
        this.addRoute('POST', path, handler, middleware);
    }

    put(path: string, handler: RouteHandler, middleware: MiddlewareFunction[] = []): void {
        this.addRoute('PUT', path, handler, middleware);
    }

    delete(path: string, handler: RouteHandler, middleware: MiddlewareFunction[] = []): void {
        this.addRoute('DELETE', path, handler, middleware);
    }

    getRoutes(): RouteDefinition[] {
        return [...this.routes];
    }

    match(method: string, path: string): { route: RouteDefinition; params: Record<string, string> } | null {
        for (const route of this.routes) {
            if (route.method !== method.toUpperCase()) continue;

            const routeParts = route.path.split('/').filter(Boolean);
            const pathParts = path.split('/').filter(Boolean);

            if (routeParts.length !== pathParts.length) continue;

            const params: Record<string, string> = {};
            let matched = true;

            for (let i = 0; i < routeParts.length; i++) {
                if (routeParts[i].startsWith(':')) {
                    params[routeParts[i].slice(1)] = pathParts[i];
                } else if (routeParts[i] !== pathParts[i]) {
                    matched = false;
                    break;
                }
            }

            if (matched) return { route, params };
        }
        return null;
    }
}

// --- Framework Core ---

class ApiFramework {
    private globalMiddleware: MiddlewareFunction[] = [];
    private routers: Router[] = [];
    private plugins: PluginConfig[] = [];
    readonly logger: Logger;
    readonly rateLimiter: RateLimiter;
    readonly validator: RequestValidator;

    constructor(rateLimitConfig?: RateLimitConfig) {
        this.logger = new Logger();
        this.rateLimiter = new RateLimiter(rateLimitConfig || { windowMs: 60000, maxRequests: 100 });
        this.validator = new RequestValidator();
    }

    use(middleware: MiddlewareFunction): void {
        this.globalMiddleware.push(middleware);
    }

    registerRouter(router: Router): void {
        this.routers.push(router);
    }

    registerPlugin(plugin: PluginConfig): void {
        this.plugins.push(plugin);
        plugin.initialize(this);
        this.logger.info(`Plugin registered: ${plugin.name} v${plugin.version}`);
    }

    async handleRequest(req: HttpRequest): Promise<HttpResponse> {
        const startTime = Date.now();

        try {
            // Find matching route
            for (const router of this.routers) {
                const match = router.match(req.method, req.path);
                if (match) {
                    req.params = match.params;

                    // Build middleware chain
                    const allMiddleware = [...this.globalMiddleware, ...match.route.middleware];
                    let middlewareIndex = 0;

                    const executeNext = async (): Promise<void> => {
                        if (middlewareIndex < allMiddleware.length) {
                            const mw = allMiddleware[middlewareIndex++];
                            const res: HttpResponse = { status: 200, body: null, headers: {} };
                            await mw(req, res, executeNext);
                        }
                    };

                    await executeNext();

                    const response = await match.route.handler(req);
                    const duration = Date.now() - startTime;
                    this.logger.info(`${req.method} ${req.path} -> ${response.status} (${duration}ms)`);
                    return response;
                }
            }

            return { status: 404, body: { error: 'Route not found' }, headers: {} };
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Internal server error';
            this.logger.error(`Request failed: ${message}`);
            return { status: 500, body: { error: message }, headers: {} };
        }
    }

    getRegisteredRoutes(): Array<{ method: string; path: string }> {
        const routes: Array<{ method: string; path: string }> = [];
        for (const router of this.routers) {
            for (const route of router.getRoutes()) {
                routes.push({ method: route.method, path: route.path });
            }
        }
        return routes;
    }
}

// --- Built-in Middleware Factories ---

function corsMiddleware(origins: string[] = ['*']): MiddlewareFunction {
    return async (req, res, next) => {
        res.headers['Access-Control-Allow-Origin'] = origins.join(', ');
        res.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS';
        res.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization';
        await next();
    };
}

function authMiddleware(validateToken: (token: string) => boolean): MiddlewareFunction {
    return async (req, _res, next) => {
        const token = req.headers['authorization']?.replace('Bearer ', '');
        if (!token || !validateToken(token)) {
            throw new Error('Unauthorized');
        }
        req.context['authenticated'] = true;
        await next();
    };
}

// --- Demo Execution ---

async function main(): Promise<void> {
    const framework = new ApiFramework({ windowMs: 60000, maxRequests: 200 });

    // Global middleware
    framework.use(corsMiddleware());

    // API Router
    const apiRouter = new Router('/api/v1');

    apiRouter.get('/health', async () => ({
        status: 200,
        body: { status: 'healthy', timestamp: new Date().toISOString() },
        headers: {}
    }));

    apiRouter.get('/users/:id', async (req) => ({
        status: 200,
        body: { id: req.params.id, name: 'Sample User', email: 'user@example.com' },
        headers: {}
    }));

    apiRouter.post('/users', async (req) => {
        const validation = framework.validator.validate(req.body, [
            { field: 'name', type: 'string', required: true, minLength: 2 },
            { field: 'email', type: 'string', required: true, pattern: '^[^@]+@[^@]+\\.[^@]+$' }
        ]);

        if (!validation.valid) {
            return { status: 400, body: { errors: validation.errors }, headers: {} };
        }

        return { status: 201, body: { message: 'User created', data: req.body }, headers: {} };
    });

    framework.registerRouter(apiRouter);

    // Test requests
    const requests: HttpRequest[] = [
        { method: 'GET', path: '/api/v1/health', params: {}, query: {}, body: null, headers: {}, context: {} },
        { method: 'GET', path: '/api/v1/users/42', params: {}, query: {}, body: null, headers: {}, context: {} },
        {
            method: 'POST', path: '/api/v1/users', params: {}, query: {},
            body: { name: 'John Doe', email: 'john@example.com' },
            headers: { 'content-type': 'application/json' }, context: {}
        },
        { method: 'GET', path: '/api/v1/unknown', params: {}, query: {}, body: null, headers: {}, context: {} }
    ];

    console.log('Enterprise API Framework - Running tests\n');
    console.log('Registered routes:', framework.getRegisteredRoutes());

    for (const req of requests) {
        const response = await framework.handleRequest(req);
        console.log(`\n${req.method} ${req.path} => Status ${response.status}`);
        console.log('Response:', JSON.stringify(response.body, null, 2));
    }
}

export { ApiFramework, Router, Logger, RateLimiter, RequestValidator };
export { corsMiddleware, authMiddleware };
export type { HttpRequest, HttpResponse, MiddlewareFunction, RouteHandler, ValidationRule, PluginConfig };

if (require.main === module) {
    main().catch(console.error);
}
