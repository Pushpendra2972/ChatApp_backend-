import { ApiError } from "../utils/ApiError.js";

const errorHandler = (err, req, res, next) => {
     
    return res.status(err.statusCode || 500).json({
        statusCode: err.statusCode || 500,
        success: err.success ?? false,
        message: err.message || "Internal Server Error",
        errors: err.errors || [],
        data: err.data || null,
    });
};
export { errorHandler };