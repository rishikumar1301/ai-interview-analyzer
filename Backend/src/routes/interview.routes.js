const express = require('express');
const authMiddleware = require('../middlewares/auth.middleware');
const interviewController = require('../controllers/interview.controller');
const upload = require('../middlewares/file.middleware');

const interviewRouter = express.Router();

/**
 * @route POST /api/interview/
 * @description Generate an interview report based on candidate resume, self-description and job description.
 * @access private
 */

interviewRouter.post('/', authMiddleware.authUser, upload.single('resume'), interviewController.generateInterViewReportController);


/**
 * @route GET /api/interview/report/:interviewId
 * @description Get interview report by interview ID.
 * @access private  
 */

interviewRouter.get('/report/:interviewId', authMiddleware.authUser, interviewController.getInterviewReportByIdController);

/**
 * @route GET /api/interview/
 * @description Get all interview reports of logged in user.
 * @access private  
 */
interviewRouter.get('/', authMiddleware.authUser, interviewController.getAllInterviewReportsController);


/**
 * @route GET /api/interview/resume/pdf
 * @description generate resume pdf on the basis of user self description, resume content and job description.
 * @access private
 */
interviewRouter.post("/resume/pdf/:interviewReportId", authMiddleware.authUser, interviewController.generateResumePdfController)


module.exports = interviewRouter;