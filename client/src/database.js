export class database  {

    static async action(url, action, headers, body)
    {
        console.log({
            url:url,
            action:action,
            headers:headers,
            body:body
        });

        return await fetch(url, {
            method: action,
            headers: headers,
            body:body
        });
    }

    static async load() {
            
        const url = 'http://' + window.location.hostname + ':7000/';

        return await database.action(url, 'GET', {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
        })
        .then(res => res.json())

    }

    static async get(ticker) {
            
        const url = 'http://' + window.location.hostname + ':7000/' + ticker;

        return await database.action(url, 'GET', {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
        })
        .then(res => res.json())

    }

    static async save(obj) {
        const url = 'http://' + window.location.hostname + ':7000/';

        await database.action(url, 'POST', {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            JSON.stringify(obj)
        );
    }
}