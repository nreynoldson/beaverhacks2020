function category_cross_out_implementation(pool, app, rand) {

    /* This GET request handles loading the category-cross-out game. */
    app.get('/category_cross_out', function (request, response, next) {
        let context = {};

        pool.connect((err, client, release) => {
            if (err) {
                return console.error('Error acquiring client.', err.stack)
            }

            context.score = 0;

            client.query('SELECT rownumber, name FROM (SELECT ROW_NUMBER() OVER (ORDER BY (SELECT 0)) as rownumber, name FROM (SELECT name FROM category ORDER BY random()) AS randomized) AS selection WHERE rownumber <= 2;', (err, result) => {
                /* Skips to the 500 page is an error is returned.*/
                if (err) {
                    next(err);
                    return console.error('Error executing query', err.stack);
                }

                context.wrong_position = rand(3) + 1;
                context.category_correct = result.rows[0].name;
                context.category_wrong = result.rows[1].name;

                client.query('SELECT name, URL, difficulty, type FROM ((SELECT name, URL, difficulty, type FROM (SELECT ROW_NUMBER() OVER (ORDER BY (SELECT 0)) AS rownumber, name, URL, difficulty, type FROM (SELECT words.name, URL, difficulty, category.name AS type from category INNER JOIN words ON category_id=type where category.name=$1 ORDER BY random()) AS randomized) AS selection WHERE rownumber <=3) UNION (SELECT name, URL, difficulty, type FROM (SELECT ROW_NUMBER() OVER (ORDER BY (SELECT 0)) AS rownumber, name, URL, difficulty, type FROM (SELECT words.name, URL, difficulty, category.name AS type from category INNER JOIN words ON category_id=type where category.name=$2 ORDER BY random()) AS randomized) AS selection WHERE rownumber < 2))AS finalFour ORDER BY random();', [context.category_correct, context.category_wrong], (err, result) => {
                    release()
                    /* Skips to the 500 page is an error is returned.*/
                    if (err) {
                        next(err);
                        return console.error('Error executing query', err.stack);
                    }

                    context.tokens = result.rows;
                    for (let i = 0; i < 4; i++) {
                        if (context.tokens[i].type === context.category_wrong) {
                            context.tokens[i].matched=0;
                        }else{
                            context.tokens[i].matched=1;
                        }
                    }

                    response.render('category_cross_out', context);
                })
            })
        });
    });
}

/*Modules is a special object which holds the exports dictionary.
* Exports is a dictionary provided automatically by node.js that
* has the keys which are the names of things in the module that
* can be used and the values are the actual value/implementation
* of those things.*/
module.exports.category_cross_out = category_cross_out_implementation;
