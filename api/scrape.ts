
export const scrapeJobs = async (scrapeType:string) => {
    try{
        const url = `${process.env.NEXT_PUBLIC_BACKEND_BASE_URL}/api/scraping/scrapeJobs?scrapeType=${scrapeType}`
        const res =  await fetch(url);

        // console.log(res,'ress')
        return await res.json()
    }catch(err){
        console.log(err, "Failed to get admin")
    }
}

export const createScrapeBatch = async (scrapeData:object) => {
    try{
        const url = `${process.env.NEXT_PUBLIC_BACKEND_BASE_URL}/api/scraping/createScrapeBatch`
        const res =  await fetch(url,{
            method:'POST',
            headers:{
                "Content-Type" : "application/json"
            },
            body: JSON.stringify(scrapeData)
        });
        // console.log(res,'ress')
        return await res.json()
    }catch(err){
        console.log(err, "Failed to get admin")
    }
}

//getting all scraped batches
export const getScrapeBatches = async () => {
    try{
        const url = `${process.env.NEXT_PUBLIC_BACKEND_BASE_URL}/api/scraping/getScrapeBatches`
        const res =  await fetch(url);

        // console.log(res,'ress')
        return await res.json()
    }catch(err){
        console.log(err, "Failed to get admin")
    }
}

//getting specific scraped batches
export const getScrapeBatch = async (batchUID : string) => {
    try{
        const url = `${process.env.NEXT_PUBLIC_BACKEND_BASE_URL}/api/scraping/getScrapeBatch?batchUID=${batchUID}`
        const res =  await fetch(url);

        // console.log(res,'ress')
        return await res.json()
    }catch(err){
        console.log(err, "Failed to get admin")
    }
}

//getting the scraped jobs

export const getScrapeJobs = async (batchUID : string) => {
    try{
        const url = `${process.env.NEXT_PUBLIC_BACKEND_BASE_URL}/api/scraping/getScrapeJobs?batchUID=${batchUID}`
        const res =  await fetch(url);

        // console.log(res,'ress')
        return await res.json()
    }catch(err){
        console.log(err, "Failed to get admin")
    }
}

//posting the scraped jobs

export const postJobsExternal = async (jobs:Array<object>) => {
    try{
        const url = `${process.env.NEXT_PUBLIC_BACKEND_BASE_URL}/api/scraping/postJobsExternal`
        const res =  await fetch(url,{
            method:'POST',
            headers:{
                "Content-Type" : "application/json"
            },
            body: JSON.stringify(jobs)
        });
        return await res.json()
    }catch(err){
        console.log(err, "Failed to get admin")
    }
}


export const getAllScrapedJobs = async () => {
    try{
        const url = `${process.env.NEXT_PUBLIC_BACKEND_BASE_URL}/api/scraping/getAllScrapedJobs`
        const res =  await fetch(url);
        // console.log(res,'ress')
        return await res.json()
    }catch(err){
        console.log(err, "Failed to get admin")
    }
}
export const deleteScrapeJob = async (jobUID:string) => {
    try{
        const url = `${process.env.NEXT_PUBLIC_BACKEND_BASE_URL}/api/scraping/deleteScrapeJob?jobUID=${jobUID}`
        const res =  await fetch(url, {
            method: 'DELETE'
        });
        // console.log(res,'ress')
        return await res.json()
    }catch(err){
        console.log(err, "Failed to get admin")
    }
}
