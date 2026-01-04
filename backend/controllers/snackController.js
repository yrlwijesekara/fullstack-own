const Snack = require('../models/Snack');

const createSnack = async (req, res) => {
    const newSnack = new Snack(req.body);
    try {
        const savedSnack = await newSnack.save();
        res.status(200).json(
            {
                message: "snack created successfully",
                snack: savedSnack
            }
        );
    } catch (err) {
        res.status(500).json({ 
            message: "Failed to create snack", 
            error: err.message
         });

    }
};

module.exports = {
    createSnack
};