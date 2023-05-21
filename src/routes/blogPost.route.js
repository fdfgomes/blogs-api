const router = require('express').Router();

const authMiddleware = require('../middlewares/auth.middleware');
const blogPostMiddleware = require('../middlewares/blogPost.middleware');
const blogPostController = require('../controllers/blogPost.controller');

router.post(
  '/',
  authMiddleware.validateToken,
  blogPostMiddleware.validateTitle,
  blogPostMiddleware.validateContent,
  blogPostMiddleware.validateCategoryIds,
  blogPostController.create,
);

module.exports = router;