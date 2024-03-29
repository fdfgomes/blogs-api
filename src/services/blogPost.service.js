const { Op } = require('sequelize');
const RESPONSE_TYPES = require('../constants/RESPONSE_TYPES');
const {
  sequelize,
  BlogPost,
  PostCategory,
  User,
  Category,
} = require('../models');

const response = (type, data, message = '') => ({
  status: type,
  data,
  message,
});

const create = async (userId, { title, content, categoryIds }) => {
  try {
    const createdPost = await sequelize.transaction(async (transaction) => {
      const post = await BlogPost.create(
        { title, content, userId },
        { transaction },
      );

      const { null: postId } = post;

      const postCategories = categoryIds.map((categoryId) => ({
        postId,
        categoryId,
      }));

      await PostCategory.bulkCreate(postCategories, { transaction });

      return { ...post.dataValues, id: postId };
    });
    return response(RESPONSE_TYPES.CREATED, createdPost);
  } catch (err) {
    return response(RESPONSE_TYPES.INTERNAL_SERVER_ERROR, null, err.message);
  }
};

const deleteById = async (postId) => {
  try {
    await BlogPost.destroy({ where: { id: postId } });
    return response(RESPONSE_TYPES.NO_CONTENT, null);
  } catch (err) {
    return response(RESPONSE_TYPES.INTERNAL_SERVER_ERROR, null, err.message);
  }
};

const findAll = async () => {
  try {
    const posts = await BlogPost.findAll({
      include: [
        {
          model: User,
          as: 'user',
          attributes: { exclude: ['password'] },
        },
        // https://stackoverflow.com/questions/45070595/sequelize-exclude-belongs-to-many-mapping-object
        { model: Category, as: 'categories', through: { attributes: [] } },
      ],
    });
    return response(RESPONSE_TYPES.OK, posts);
  } catch (err) {
    return response(RESPONSE_TYPES.INTERNAL_SERVER_ERROR, null, err.message);
  }
};

const findById = async (postId) => {
  try {
    const post = await BlogPost.findOne({
      where: { id: postId },
      include: [
        {
          model: User,
          as: 'user',
          attributes: { exclude: ['password'] },
        },
        // https://stackoverflow.com/questions/45070595/sequelize-exclude-belongs-to-many-mapping-object
        { model: Category, as: 'categories', through: { attributes: [] } },
      ],
    });
    if (!post) return response(RESPONSE_TYPES.NOT_FOUND, null, 'Post does not exist');
    return response(RESPONSE_TYPES.OK, post);
  } catch (err) {
    return response(RESPONSE_TYPES.INTERNAL_SERVER_ERROR, null, err.message);
  }
};

const findAllBySearchTerm = async (searchTerm) => {
  try {
    const posts = await BlogPost.findAll({
      include: [
        { model: User, as: 'user', attributes: { exclude: ['password'] } },
        // https://stackoverflow.com/questions/45070595/sequelize-exclude-belongs-to-many-mapping-object
        { model: Category, as: 'categories', through: { attributes: [] } },
      ],
      where: {
        [Op.or]: [
          { title: { [Op.like]: `%${searchTerm}%` } },
          { content: { [Op.like]: `%${searchTerm}%` } },
        ],
      },
    });
    return response(RESPONSE_TYPES.OK, posts);
  } catch (err) {
    return response(RESPONSE_TYPES.INTERNAL_SERVER_ERROR, null, err.message);
  }
};

const updateById = async (userId, postId, { title, content }) => {
  try {
    await BlogPost.update(
      { title, content },
      { where: { id: postId, userId } },
    );
    const { data: updatedPost } = await findById(postId);
    return response(RESPONSE_TYPES.OK, updatedPost);
  } catch (err) {
    return response(RESPONSE_TYPES.INTERNAL_SERVER_ERROR, null, err.message);
  }
};

module.exports = {
  create,
  deleteById,
  findAll,
  findById,
  findAllBySearchTerm,
  updateById,
};
