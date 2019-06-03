"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const fs = require("fs");
function analysis(app, DATA_FILE_BASEPATH) {
    app.get("/analysis/file", (req, res) => {
        let filename = req.query.filename;
        if (filename != null && filename != "") {
            filename = filename.replace(/[/\\?%*:|"<>]/g, '-'); // remove any invalid characters
        }
        let filepath = path.join(DATA_FILE_BASEPATH, filename);
        filepath = path.resolve(filepath); // make absolute
        if (fs.existsSync(filepath))
            res.sendFile(filepath);
        else {
            res.sendStatus(404);
        }
    });
}
exports.analysis = analysis;
//# sourceMappingURL=analysis.js.map