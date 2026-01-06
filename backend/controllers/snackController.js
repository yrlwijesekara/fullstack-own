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

const deleteSnack = async (req, res) => {
    if (!checkIsAdmin(req)) {
        return res.status(403).json({ 
            message: 'Access denied. Admin privileges required.',
            error: 'Forbidden'
         });
    }
    
    try {
        const snackId = req.params.snackid;
        const result = await Snack.findByIdAndDelete(snackId);
        
        if (!result) {
            return res.status(404).json({ 
                message: 'Snack not found',
                error: 'Not Found'
             });
        }
        
        res.status(200).json({ 
            message: 'Snack deleted successfully'
         });
         
    } catch (err) {
        console.error('Error deleting snack:', err);
        res.status(500).json({ 
            message: "Failed to delete snack", 
            error: err.message
         });
    }
};
const updatesnack = async (req, res) => {
    if (!checkIsAdmin(req)) {
        return res.status(403).json({ 
            message: 'Access denied. Admin privileges required.',
            error: 'Forbidden'
         });
    }
    
    try {
        const data = req.body;
        const snackId = req.params.snackid;
        
        const result = await Snack.updateOne({ _id: snackId }, data);
        
        if (result.matchedCount === 0) {
            return res.status(404).json({ 
                message: 'Snack not found',
                error: 'Not Found'
             });
        }
        
        res.status(200).json({ 
            message: 'Snack updated successfully'
         });
    } catch (err) {
        console.error('Error updating snack:', err);
        res.status(500).json({ 
            message: "Failed to update snack", 
            error: err.message
         });
    }
};

const getSnackinfo = async (req, res) => {
    try {
        const snackid = req.params.snackid;
        let snack;
        
        if (checkIsAdmin(req)) {
            snack = await Snack.findById(snackid);
        } else {
            snack = await Snack.findOne({
                _id: snackid,
                isAvailable: true
            });
        }
        
        if (snack == null) {
            return res.status(404).json({
                message: "Snack not found",
                error: "Not Found"
            });
        }
        
        res.status(200).json({
            message: "Snack fetched successfully",
            snack: snack
        });
        
    } catch (err) {
        res.status(500).json({
            message: "Failed to fetch snack",
            error: err.message
        });
    }
};

module.exports = {
    createSnack,
    getproducts,
    deleteSnack,
    updatesnack,
    getSnackinfo
};