const db = require('./db');

const main = async () => {
    // console.log(await db.getImagesByTag('volibear'));
    db.migrate();
};

main();
