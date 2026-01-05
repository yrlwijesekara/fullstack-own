const { checkIsAdmin } = require('../middleware/auth');
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

const getproducts = async (req, res) => {
    try {
        if(checkIsAdmin(req)){
            const snacks = await Snack.find();
            res.status(200).json(
                {
                    message: "snacks fetched successfully",
                    snacks: snacks
                }
            );
        }else{
            const snacks = await Snack.find({ isAvailable: true });
            res.status(200).json(
                {
                    message: "snacks fetched successfully",
                    snacks: snacks
                }
            );
            
        } 
    } catch (err) {
        res.status(500).json({ 
            message: "Failed to fetch snacks", 
            error: err.message
         });
    }
};

module.exports = {
    createSnack,
    getproducts
};