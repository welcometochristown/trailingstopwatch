export class database  {

    static async action(url, action, headers, body)
    {
        console.log({
            url:url,
            action:action,
            headers:headers,
            body:body
        });

<<<<<<< HEAD
        try
        {
            return await fetch(url, {
                method: action,
                headers: headers,
                body:body
            });
            
        }catch(err) {
            console.log(err);
        }
       
    }

    static async reload() {
            
        const url = 'http://' + window.location.hostname + ':7000/reload';

        return await database.action(url, 'GET', {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
        })
        .then(res => res.status);


=======
        return await fetch(url, {
            method: action,
            headers: headers,
            body:body
        });
>>>>>>> 23f90f7ade73d7c7988d5f397c058de6096ae370
    }

    static async load() {
            
        const url = 'http://' + window.location.hostname + ':7000/';

        return await database.action(url, 'GET', {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
        })
        .then(res => res.json())

    }

<<<<<<< HEAD
    static async delete(id) {

        const url = 'http://' + window.location.hostname + ':7000/' + id;

        return await database.action(url, 'DELETE', {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
        })
        .then(res => res.status);

    }

    static async deleteTickers() {
            
        const url = 'http://' + window.location.hostname + ':7000/tickers';

        return await database.action(url, 'DELETE', {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
        })
        .then(res => res.status);

    }

    static async deleteMarkets() {
            
        const url = 'http://' + window.location.hostname + ':7000/markets';

        return await database.action(url, 'DELETE', {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
        })
        .then(res => res.status);

    }

    static async deleteAll() {
            
        const url = 'http://' + window.location.hostname + ':7000/all';

        return await database.action(url, 'DELETE', {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
        })
        .then(res => res.status);

    }

    static async getPrice(body) {
            
        const url = 'http://' + window.location.hostname + ':7000/price';

        return await database.action(url, 'POST', {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            JSON.stringify(body)
        )
        .then(res => res.json());

    }

    static async insert(obj) {
        const url = 'http://' + window.location.hostname + ':7000/';

        return await database.action(url, 'PUT', {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            JSON.stringify(obj)

        ).then(res => res.json());
    }

    
    static async update(obj) {
        const url = 'http://' + window.location.hostname + ':7000/';

        return await database.action(url, 'POST', {
=======
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
>>>>>>> 23f90f7ade73d7c7988d5f397c058de6096ae370
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            JSON.stringify(obj)
<<<<<<< HEAD
        ).then(res => res.json());
    }

=======
        );
    }
>>>>>>> 23f90f7ade73d7c7988d5f397c058de6096ae370
}