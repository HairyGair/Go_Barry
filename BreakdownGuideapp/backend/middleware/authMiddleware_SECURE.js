// SECURE Authentication middleware - Development bypass REMOVED
// This is the critical section that needs to be updated in authMiddleware.js

// Replace lines 165-286 in authMiddleware.js with this secure version:

// Middleware to verify JWT token
export const verifyToken = async (req, res, next) => {
    try {
        // Check for token in HTTP-only cookie first (preferred secure method)
        let token = req.cookies?.auth_token;
        let tokenSource = 'cookie';

        if (!token) {
            // Fallback: Check Authorization header (for backward compatibility)
            const authHeader = req.headers.authorization;

            if (authHeader && authHeader.startsWith('Bearer ')) {
                token = authHeader.substring(7);
                tokenSource = 'header';
            }
        }

        // SECURITY: ALWAYS require authentication - NO BYPASSES
        if (!token) {
            return res.status(401).json({
                error: 'Authentication required',
                code: 'AUTH_TOKEN_MISSING'
            });
        }

        // Verify token signature and expiration
        let decoded;
        try {
            decoded = jwt.verify(token, JWT_SECRET);
        } catch (jwtError) {
            if (jwtError.name === 'TokenExpiredError') {
                return res.status(401).json({
                    error: 'Token has expired',
                    code: 'AUTH_TOKEN_EXPIRED'
                });
            }
            console.warn('Invalid token provided:', jwtError.message);
            return res.status(401).json({
                error: 'Invalid or expired token',
                code: 'AUTH_TOKEN_INVALID'
            });
        }

        // Extract user ID from token
        const userId = decoded.sub || decoded.id || decoded.user_id;
        if (!userId) {
            return res.status(401).json({
                error: 'Invalid token format',
                code: 'AUTH_TOKEN_MALFORMED'
            });
        }

        // Fetch user from database to verify they still exist and are active
        const { data: supervisor, error } = await from('supervisors')
            .select('id, email, name, depot, role, is_active, badge_number')
            .eq('id', userId)
            .single();

        if (error || !supervisor) {
            console.warn('User not found for token:', userId);
            return res.status(401).json({
                error: 'User not found',
                code: 'AUTH_USER_NOT_FOUND'
            });
        }

        // Check if user is active
        if (!supervisor.is_active) {
            console.warn('Inactive user attempted access:', supervisor.email);
            return res.status(403).json({
                error: 'Account is inactive',
                code: 'AUTH_USER_INACTIVE'
            });
        }

        // Attach user info to request
        req.user = {
            id: supervisor.id,
            email: supervisor.email,
            name: supervisor.name,
            role: supervisor.role || 'supervisor',
            depot: supervisor.depot,
            badge_number: supervisor.badge_number,
            aud: decoded.aud || 'authenticated',
            exp: decoded.exp,
            iat: decoded.iat
        };

        // CRITICAL: NO DEVELOPMENT MODE BYPASS
        // Lines 265-279 COMPLETELY REMOVED
        // No automatic admin privileges in development

        next();
    } catch (error) {
        console.error('Token verification error:', error);
        return res.status(401).json({
            error: 'Authentication failed',
            code: 'AUTH_VERIFICATION_FAILED'
        });
    }
};

// Middleware to check if user is authorized supervisor (SECURE VERSION)
export const requireSupervisor = async (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                error: 'Authentication required',
                code: 'AUTH_USER_MISSING'
            });
        }

        // Check if user exists in supervisors table
        const { data: supervisor, error } = await from('supervisors')
            .select('id, email, name, depot, role, badge_number')
            .eq('email', req.user.email.toLowerCase())
            .eq('is_active', true)
            .single();

        if (error || !supervisor) {
            console.warn(`Unauthorized access attempt by ${req.user.email}`);
            return res.status(403).json({
                error: 'Access denied. Supervisor privileges required.',
                code: 'AUTH_INSUFFICIENT_PRIVILEGES'
            });
        }

        // Attach supervisor info to request
        req.supervisor = supervisor;
        req.user.supervisorRole = supervisor.role;
        req.user.depot = supervisor.depot;
        req.user.badge_number = supervisor.badge_number;

        // CRITICAL: NO DEVELOPMENT MODE BYPASS
        // Lines 324-338 COMPLETELY REMOVED
        // No automatic supervisor privileges in development

        next();
    } catch (error) {
        console.error('Supervisor authorization error:', error);
        return res.status(500).json({
            error: 'Authorization check failed',
            code: 'AUTH_CHECK_FAILED'
        });
    }
};