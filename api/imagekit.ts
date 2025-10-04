
export const getFileUrl = async (payload: string[]) => {
    try{
        const url = `${process.env.NEXT_PUBLIC_BACKEND_BASE_URL}/api/employers/imagekit/getFileUrl`


        console.log((payload),'aa')

        const requestBody = {
            filePaths: payload
        }

        const res =  await fetch(url,{
            method:'POST',
            headers:{
                "Content-Type" : "application/json"
            },
            body: JSON.stringify(requestBody)
        });
        return await res.json()
    }catch(err){
        console.log(err, "Failed to get admin")
    }

}