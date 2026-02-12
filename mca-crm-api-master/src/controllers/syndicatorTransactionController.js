const Joi = require('joi');

const SyndicatorTransactionService = require('../services/syndicatorTransactionService');

const ErrorResponse = require('../utils/errorResponse');

const default_populate = [
    {
        path: 'syndicator',
        select: 'name first_name last_name email phone_mobile'
    },
    {
        path: 'funder',
        select: 'name email phone'
    },
    {
        path: 'created_by_user',
        select: 'first_name last_name email phone_mobile'
    },
    {
        path: 'updated_by_user',
        select: 'first_name last_name email phone_mobile'
    }
];

// @desc    Get all syndicator transactions
// @route   GET /api/v1/syndicator-transactions
// @access  Private/Admin
exports.getSyndicatorTransactions = async (req, res, next) => {
    try {
        const schema = Joi.object({
            page: Joi.number().default(1).optional(),
            limit: Joi.number().default(10).optional(),
            sort: Joi.string().optional(),
            syndicator: Joi.string().optional(),
            funder: Joi.string().optional(),
            type: Joi.string().optional(),
            status: Joi.string().optional(),
            reconciled: Joi.boolean().optional()
        });

        const { value, error } = schema.validate(req.query);

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        const { page, limit, sort, ...query } = value;

        // Handle query
        let dbQuery = {};

        // Handle filter
        if (req.filter?.funder_list) {
            if(query.funder){
                if(!req.filter.funder_list.includes(query.funder)){
                    return next(new ErrorResponse('You don\'t have permission to access this syndication offer', 403));
                }else{
                    dbQuery.funder = query.funder;
                }
            }else{
                dbQuery.funder = { $in: req.filter.funder_list };
            }
        }else{
            if(query.funder){
                dbQuery.funder = query.funder;
            }
        }

        if(req.filter?.syndicator_list){
            if(query.syndicator){
                if(!req.filter.syndicator_list.includes(query.syndicator)){
                    return next(new ErrorResponse('You don\'t have permission to access this syndication offer', 403));
                }else{
                    dbQuery.syndicator = query.syndicator;
                }
            }else{
                dbQuery.syndicator = { $in: req.filter.syndicator_list };
            }
        }else{
            if(query.syndicator){
                dbQuery.syndicator = query.syndicator;
            }
        }

        if(query.type){
            dbQuery.type = query.type;
        }

        if(query.status){
            dbQuery.status = query.status;
        }

        if(query.reconciled){
            dbQuery.reconciled = query.reconciled;
        }

        // Handle sort
        let dbSort = {};
        if(sort){
            const sortFields = sort.split(',');
            sortFields.forEach(field => {
                if(field.startsWith('-')){
                    dbSort[field.substring(1)] = -1;
                }else{
                    dbSort[field] = 1;
                }
            });
        }else{
            dbSort = { created_date: -1 };
        }

        // Handle pagination
        const syndicatorTransactions = await SyndicatorTransactionService.getSyndicatorTransactions(
            dbQuery,
            page,
            limit,
            dbSort,
            default_populate
        );

        res.status(200).json({
            success: true,
            data: syndicatorTransactions
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Create a new syndicator transaction
// @route   POST /api/v1/syndicator-transactions
// @access  Private/Admin
exports.createSyndicatorTransaction = async (req, res, next) => {
    try {
        const schema = Joi.object({
            syndicator: Joi.string().required(),
            funder: Joi.string().required(),
            type: Joi.string().required(),
            created_by_user: Joi.string().optional(),
            hit_date: Joi.date().optional(),
            response_date: Joi.date().optional(),
            amount: Joi.number().required(),
            syndicator_account: Joi.object().optional(),
            funder_account: Joi.object().optional(),
            status: Joi.string().required(),
            reconciled: Joi.boolean().optional()
        });

        const { value, error } = schema.validate(req.body);

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        const syndicatorTransaction = await SyndicatorTransactionService.createSyndicatorTransaction(value, default_populate);

        res.status(201).json({
            success: true,
            data: syndicatorTransaction
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get syndicator transaction list without pagination
// @route   GET /api/v1/syndicator-transactions/list
// @access  Private/Admin
exports.getSyndicatorTransactionsList = async (req, res, next) => {
    try {
        const schema = Joi.object({
            syndicator: Joi.string().optional(),
            funder: Joi.string().optional(),
            type: Joi.string().optional(),
            status: Joi.string().optional(),
            reconciled: Joi.boolean().optional()
        });

        const { value, error } = schema.validate(req.query);
        
        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        let dbQuery = {};

        if(req.filter?.funder_list){
            if(value.funder){
                if(!req.filter.funder_list.includes(value.funder)){
                    return next(new ErrorResponse('You don\'t have permission to access this syndication offer', 403));
                }else{
                    dbQuery.funder = value.funder;
                }
            }else{
                dbQuery.funder = { $in: req.filter.funder_list };
            }
        }else{
            if(value.funder){
                dbQuery.funder = value.funder;
            }
        }

        if(req.filter?.syndicator_list){
            if(value.syndicator){
                if(!req.filter.syndicator_list.includes(value.syndicator)){
                    return next(new ErrorResponse('You don\'t have permission to access this syndication offer', 403));
                }else{
                    dbQuery.syndicator = value.syndicator;
                }
            }else{
                dbQuery.syndicator = { $in: req.filter.syndicator_list };
            }
        }else{
            if(value.syndicator){
                dbQuery.syndicator = value.syndicator;
            }
        }

        if(value.type){
            dbQuery.type = value.type;
        }

        if(value.status){
            dbQuery.status = value.status;
        }

        if(value.reconciled){
            dbQuery.reconciled = value.reconciled;
        }

        const syndicatorTransactions = await SyndicatorTransactionService.getSyndicatorTransactionList(
            dbQuery,
            default_populate
        );

        res.status(200).json({
            success: true,
            data: syndicatorTransactions
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Update syndicator transaction
// @route   PUT /api/v1/syndicator-transactions/:id
// @access  Private/Admin
exports.updateSyndicatorTransaction = async (req, res, next) => {
    try {
        const schema = Joi.object({
            id: Joi.string().required(),
            type: Joi.string().optional(),
            hit_date: Joi.date().optional(),
            response_date: Joi.date().optional(),
            status: Joi.string().optional(),
            updated_by_user: Joi.string().optional(),
            reconciled: Joi.boolean().optional()
        });

        const { value, error } = schema.validate({ ...req.params, ...req.body });

        if (error) {
            return next(new ErrorResponse(error.message, 400));
        }

        const { id, ...syndicatorTransactionData } = value;

        const syndicatorTransaction = await SyndicatorTransactionService.getSyndicatorTransactionById(id);

        if(req.filter?.funder_list){
            if(!req.filter.funder_list.includes(syndicatorTransaction.funder.toString())){
                return next(new ErrorResponse('You don\'t have permission to access this syndication offer', 403));
            }
        }

        if(req.filter?.syndicator_list){
            if(!req.filter.syndicator_list.includes(syndicatorTransaction.syndicator.toString())){
                return next(new ErrorResponse('You don\'t have permission to access this syndication offer', 403));
            }
        }

        const updatedSyndicatorTransaction = await SyndicatorTransactionService.updateSyndicatorTransaction(id, syndicatorTransactionData, default_populate);

        res.status(200).json({
            success: true,
            data: updatedSyndicatorTransaction
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Get single syndicator transaction
// @route   GET /api/v1/syndicator-transactions/:id
// @access  Private/Admin
exports.getSyndicatorTransaction = async (req, res, next) => {
    try {
        const schema = Joi.object({
            id: Joi.string().required()
        });

        const { value, error } = schema.validate(req.params);
        
        if(error){
            return next(new ErrorResponse(error.message, 400));
        }

        const syndicatorTransaction = await SyndicatorTransactionService.getSyndicatorTransactionById(value.id, default_populate);

        if(!syndicatorTransaction){
            return next(new ErrorResponse('Syndicator transaction not found', 404));
        }

        // verify funder
        if(req.filter?.funder_list){
            if(!req.filter.funder_list.includes(syndicatorTransaction.funder._id.toString())){
                return next(new ErrorResponse('You don\'t have permission to access this syndication offer', 403));
            }
        }

        // verify syndicator
        if(req.filter?.syndicator_list){
            if(!req.filter.syndicator_list.includes(syndicatorTransaction.syndicator._id.toString())){
                return next(new ErrorResponse('You don\'t have permission to access this syndication offer', 403));
            }
        }

        res.status(200).json({
            success: true,
            data: syndicatorTransaction
        });
    } catch (err) {
        next(err);
    }
};