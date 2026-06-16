declare global {
  namespace Express {
    interface Request {
      auth?: {
        _id: string;
        role: string;
      };
    }
  }
}

export {};