const URL='http://localhost:3000/api/book';
const total_requests=200;

async function run() {
    console.log(`Firing ${total_requests} concurrent requests`);

    const requests=[];

    for(let i=1;i<=total_requests;i++) {
        const request=fetch(URL, {
            method: 'POST',
            headers: {'Content-Type':`application/json`},
            body: JSON.stringify({userID:1,eventID:1})
        }
        )
        .then(res =>res.json())
        .catch(err => ({error:`Network Failure`}));
        requests.push(request);
    }
    const results =await Promise.all(requests);
    let successCount=0;
    let soldCount=0;

    results.forEach(res => {
        if(res.message) successCount++;
        if(res.error) soldCount++;
    });
    console.log(`\nTEST COMPLETE`);
    console.log(`Tickets Successfully Sold: ${successCount}`);
    console.log(`Users Denied (Sold Out): ${soldCount}`);
}

run();