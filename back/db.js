const sqlite3 = require('sqlite3').verbose()
const db = new sqlite3.Database('./db/images.db')

db.run('CREATE TABLE if not exists image(imageid INTEGER PRIMARY KEY, name text NOT NULL)');
db.run('CREATE TABLE if not exists tag(tagid INTEGER PRIMARY KEY, tag text UNIQUE NOT NULL)');
db.run('CREATE TABLE if not exists imagetag(fk_imageid INTEGER NOT NULL, fk_tagid INTEGER NOT NULL)');

function migrate2() {
    const oldTagList = [];
    db.all(`
        select tags from old_images
    `, [], function (err, rows) {
        rows.forEach(tagRow => {
            const { tags } = tagRow;
            if (tags.length > 0) {
                const split = tags.toLowerCase().trim().split(' ');
                split.forEach(t => {
                    if (!oldTagList.includes(t)) {
                        oldTagList.push(t);
                        // console.log(t);
                    }
                });
            }
        })
        console.log(oldTagList);
        const placeholders = oldTagList.map(x => '(?)').join(',');
        db.run(`
            insert into tag (tag)
            values ${placeholders}
        `, oldTagList, function(err) {
            if (err) console.log(err);
        });
    })
}

function migrate() {
    const imageTags = [];
    // const oldTags = [];
    db.all(`SELECT name, tags from old_images`, [], function(err, rows) {
        const oldTags = rows.map(x => {return { name: x.name, tags: x.tags.trim().toLowerCase().split(' ')}});
        // console.log(oldTags);
        db.all(`SELECT tag from tag`, [], function(err, rows) {
            const newTags = rows.map(row => row.tag);
            // console.log(newTags);
            oldTags.forEach(ot => {
                newTags.forEach(nt => {
                    if (ot.tags.includes(nt)) {
                        // console.log(ot.name, nt);
                        db.get(`select imageid from image where name=?`, [ot.name], (err, row) => {
                            const imageId = row.imageid;
                            db.get('select tagid from tag where tag=?', [nt], (err, row) => {
                                const tagId = row.tagid;
                                // console.log(imageId, tagId);
                                db.run(`INSERT INTO imagetag (fk_imageid, fk_tagid) VALUES ('${imageId}', '${tagId}')`, (err) => {
                                    if (err) console.log(err);
                                })
                            })
                        })
                    }
                })
            })
            // newTags.forEach(nt => {
                // db.all(`
                //     select name from old_images
                //     where tags like '%${nt}%'
                // `, [], function (err, rows) {
                //     if (err) console.log(err);
                //     // console.log(nt, rows);
    
                // })
            // });
        })
    })
}

function insertImage(name, tags) {
    throw new Error('Not implemented.');
}

function getImages() {
    return new Promise((res, rej) => {
        let sql = 'SELECT * FROM image';
        db.all(sql, [], function(err, rows) {
            if (err) rej(err);
            res(rows);
        });
    });
};

function getImagesByTag(tags) {
    return new Promise((res, rej) => {
        // const placeholder = tags.map(t => '(?)').join(',');
        let sql = `
            select name, imageid from image
            join imagetag as it on it.fk_imageid=imageid
            join tag on tagid=fk_tagid
            where tag=(?)
        `;
        db.all(sql, [tags], function(err, rows) {
            if (err) rej(err);
            res(rows);
        });
    });
};

function deleteImage() {
    throw new Error('Not implemented.');
}

function getTagsByImageId(id) {
    return new Promise((res, rej) => {
        let sql = 
        `select tag
        from tag
        join imagetag as it on it.fk_tagid = tag.tagid
        join image on image.imageid = it.fk_imageid
        where image.imageid = ?`
        db.all(sql, [id], function(err, rows) {
            if (err) rej(err);
            res(rows);
        });
    });
};

function getTags() {
    return new Promise((res, rej) => {
        let sql = 'SELECT * FROM tag';
        db.all(sql, [], function(err, rows) {
            if (err) rej(err);
            res(rows);
        });
    });
};

module.exports = {
    getAll,
    deleteImage,
    insertImage,
    getTagsByImageId,
    getImages,
    getTags,
    getImagesByTag,
}
