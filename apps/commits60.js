const https = require('https');
fs = require('fs');

var options = {
    headers: { 'user-agent': 'node.js' }
};

var myArgs = process.argv.slice(2);

var user = myArgs[0]
var authToken = myArgs[1]

https.get('https://api.github.com/users/' + user + '/repos', options, (resp) => {
    let data = '';

    // A chunk of data has been received.
    resp.on('data', (chunk) => {
        data += chunk;
    });

    // The whole response has been received. .
    resp.on('end', () => {
        var repos = JSON.parse(data)

        async function extractCommits() {
            var commitsList = [];
            
             for (const element of repos) {
                commitsList = commitsList.concat(await getRepoCommitsAsync(element.full_name))
             }
            
            // CommitsList has now the list of all user commits
            // Now sort commitsList by date in descending order
            commitsList.sort((a, b) => a - b);

            // Then cut the last 60 commits only
            commitsList.slice(0, 59)

            // Then calculate time between each commit and sum it
            var sumOfDifferences = 0
            for (let index = 0; index < commitsList.length - 1; index++) {
            
                const date1 = Date.parse(commitsList[index])
                const date2 = Date.parse(commitsList[index + 1])

                sumOfDifferences += date2 - date1;
            }

            var averageTime = sumOfDifferences / (commitsList.length - 1)
            console.log("Average Time: ", averageTime)
            const writeStream = fs.createWriteStream('commits.csv');           
            writeStream.write('"' + commitsList.join('"\n"') + '"\n');

            console.log("commits times have been stored in commits.csv" )
        }

        extractCommits().then(console.log("Done!"))
    });

}).on("error", (err) => {
    console.log("Error: " + err.message);
});



function getRepoCommitsAsync(aRepoName) {
    return new Promise(resolve => {
        https.get('https://api.github.com/repos/' + aRepoName + '/commits', options, (resp) => {
            let data = '';
            let commitsDates = [];

            // A chunk of data has been received.
            resp.on('data', (chunk) => {
                data += chunk;
            });

            // The whole response has been received. Retrieve the commits dates.
            resp.on('end', () => {
                let commits = JSON.parse(data)
                commits.forEach(element => {
                    commitsDates.push(element.commit.author.date)
                });
                resolve(commitsDates)
            });

        }).on("error", (err) => {
            console.log("Error: " + err.message);
        });
    });
}
