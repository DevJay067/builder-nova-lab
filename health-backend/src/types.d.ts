// This file is optional and for editor intellisense only.
// @ts-ignore
import 'express-serve-static-core';

declare global {
	namespace Express {
		interface Request {
			user?: { id: string; email: string; role?: 'user' | 'admin' };
		}
	}
}

export {};