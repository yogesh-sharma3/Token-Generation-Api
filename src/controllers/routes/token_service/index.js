const helper = global.helper;
const express = helper.module.express;
const router = express.Router();
const services = require('../../../services');
const { generateToken,consumeToken } = services.token_service;
const utilities = require('../../../utilities');
const safePromise = utilities.safePromise;


router.get('/generateToken', async (req, res) => {
  const [error, token] = await safePromise(generateToken())

  if (error) {
    return res.status(500).json({
      message: error
    });
  }
  res.json({
    token: token
  })
});
router.post('/consumeToken', async (req, res) => {
  const token = req.body.token
  const [error, response] = await safePromise(consumeToken(token))

  if (error) {
    return res.status(500).json({
      message: error
    });
  }
  res.json({
    message: response
  })
});




module.exports = router;