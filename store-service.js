const Sequelize = require('sequelize');

var sequelize = new Sequelize('SenecaDB', 'SenecaDB_owner', 'r0RgdswLhz7I', {
    host: 'ep-winter-queen-a5h5c0fb.us-east-2.aws.neon.tech',
    dialect: 'postgres',
    port: 5432,
    dialectOptions: {
        ssl: { rejectUnauthorized: false } 
    },
    dialectModule: require('pg'),
    query: { raw: true }
});

// Define the Item model
const Item = sequelize.define('Item', {
  body: Sequelize.TEXT,
  title: Sequelize.STRING,
  postDate: Sequelize.DATE,
  featureImage: Sequelize.STRING,
  published: Sequelize.BOOLEAN,
  price: Sequelize.DOUBLE
});

// Define the Category model
const Category = sequelize.define('Category', {
  category: Sequelize.STRING
});

// Define the relationship
Item.belongsTo(Category, { foreignKey: 'category' });

// Initialize the database
function initialize() {
  return new Promise((resolve, reject) => {
      sequelize.sync()
          .then(() => resolve('Database & tables created!'))
          .catch(err => reject('Unable to sync the database: ' + err));
  });
}

// Get all items
function getAllItems() {
  return new Promise((resolve, reject) => {
      Item.findAll()
          .then(data => resolve(data))
          .catch(err => reject('No results returned'));
  });
}

// Get items by category
function getItemsByCategory(categoryId) {
  return new Promise((resolve, reject) => {
      Item.findAll({
          where: {
              category: categoryId
          }
      })
          .then(data => resolve(data))
          .catch(err => reject('No results returned'));
  });
}

// Get items by minimum date
function getItemsByMinDate(minDateStr) {
  const { gte } = Sequelize.Op;
  return new Promise((resolve, reject) => {
      Item.findAll({
          where: {
              postDate: {
                  [gte]: new Date(minDateStr)
              }
          }
      })
          .then(data => resolve(data))
          .catch(err => reject('No results returned'));
  });
}

// Get item by ID
function getItemById(id) {
  return new Promise((resolve, reject) => {
      Item.findAll({
          where: {
              id: id
          }
      })
          .then(data => resolve(data[0]))
          .catch(err => reject('No results returned'));
  });
}

// Add a new item
function addItem(itemData) {
  return new Promise((resolve, reject) => {
      // Ensure the published property is set correctly
      itemData.published = itemData.published ? true : false;

      // Replace empty properties with null
      for (let prop in itemData) {
          if (itemData[prop] === '') itemData[prop] = null;
      }

      // Set the post date to the current date
      itemData.postDate = new Date();

      // Create a new item
      Item.create(itemData)
          .then(() => resolve())
          .catch(err => reject('Unable to create item: ' + err));
  });
}

// Get published items
function getPublishedItems() {
  return new Promise((resolve, reject) => {
      Item.findAll({
          where: {
              published: true
          }
      })
          .then(data => resolve(data))
          .catch(err => reject('No results returned'));
  });
}

// Get published items by category
function getPublishedItemsByCategory(categoryId) {
  return new Promise((resolve, reject) => {
      Item.findAll({
          where: {
              published: true,
              category: categoryId
          }
      })
          .then(data => resolve(data))
          .catch(err => reject('No results returned'));
  });
}

// Get all categories
function getCategories() {
  return new Promise((resolve, reject) => {
      Category.findAll()
          .then(data => resolve(data))
          .catch(err => reject('No results returned'));
  });
}

// Add a new category
function addCategory(categoryData) {
  return new Promise((resolve, reject) => {
      // Replace empty properties with null
      for (let prop in categoryData) {
          if (categoryData[prop] === '') categoryData[prop] = null;
      }

      // Create a new category
      Category.create(categoryData)
          .then(() => resolve())
          .catch(err => reject('Unable to create category: ' + err));
  });
}

// Delete a category by ID
function deleteCategoryById(id) {
  return new Promise((resolve, reject) => {
      Category.destroy({
          where: {
              id: id
          }
      })
          .then(result => {
              if (result) resolve();
              else reject('Category not found');
          })
          .catch(err => reject('Unable to delete category: ' + err));
  });
}

// Delete a post by ID
function deletePostById(id) {
  return new Promise((resolve, reject) => {
      Item.destroy({
          where: {
              id: id
          }
      })
          .then(result => {
              if (result) resolve();
              else reject('Post not found');
          })
          .catch(err => reject('Unable to delete post: ' + err));
  });
}

// Export functions
module.exports = {
  initialize,
  getAllItems,
  getItemsByCategory,
  getItemsByMinDate,
  getItemById,
  addItem,
  getPublishedItems,
  getPublishedItemsByCategory,
  getCategories,
  addCategory,
  deleteCategoryById,
  deletePostById
};
