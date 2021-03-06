import * as express from 'express';
import {validate} from '../services/validation'
import {run} from '../services/exec';
import {Task} from '../models/taskModel';


export class TaskController {
    constructor() {
    }

    /**
     * Find all request
     * @param req
     * @param res
     */
    static findAll(req: express.Request, res: express.Response) {
        Task.find({})
            .then(response => res.json(response))
            .catch(error => res.json({message: error.message}));
    }

    /**
     * Create and run
     * @param req
     * @param res
     * @returns {Response}
     */
    static createAndRun(req: express.Request, res: express.Response): express.Response {
        const schema = {
            "type": 'object',
            "properties": {
                "title": {type: 'string'},
                "command": {type: 'string'},
                "filePath": {type: 'string'},
                "saveAndRun": {type: 'boolean'}
            },
            "required": ['title'],
        };

        if (req.body.filePath) schema.required.push("filePath");
        if (req.body.command) schema.required.push("command");

        const error = validate(req.body, schema);
        if (!error.valid) {
            return res.json(error);
        }

        let task = new Task({
            title: req.body.title,
            command: req.body.command || '',
            filePath: req.body.filePath || ''
        });

        task.save((err, savedTask) => {
            if (err) return res.json(err.message);
            if (!req.body.saveAndRun) return res.json({task: savedTask});
            run(savedTask, (stdout, stderr) => {
                res.json({task: savedTask, stdout, stderr});
            });
        });
    }

    /**
     * Run
     * @param req
     * @param res
     * @returns {Response}
     */
    static runOne(req: express.Request, res: express.Response): express.Response {
        if (!req.params.id) return res.json({message: 'ID required'});
        const id = req.params.id;

        Task.findById(id, (err, task) => {
            if (err) return res.json({message: err.message});
            if (!task) return res.json({message: 'task not found'});
            run(task, (stdout, stderr) => res.json({task, stdout, stderr}));
        });
    }

    /**
     * Remove task
     * @param req
     * @param res
     * @returns {Response}
     */
    static remove(req: express.Request, res: express.Response): express.Response {
        if (!req.params.id) return res.json({message: 'ID required'});
        const id = req.params.id;

        Task.findOne({_id: id}).remove((err, removed) => {
            if (err) return res.json({message: err.message});
            return res.json(removed);
        });
    }
}
