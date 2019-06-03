import * as path from 'path';
import * as fs from "fs";

export function analysis(app, DATA_FILE_BASEPATH: string) {

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