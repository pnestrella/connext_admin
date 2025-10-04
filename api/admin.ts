

export const getAdmin = async (adminUID:string) => {
    try{
        const url = `${process.env.NEXT_PUBLIC_BACKEND_BASE_URL}/api/admins/getAdmin/${adminUID}`

        const res =  await fetch(url);

        return await res.json()

    }catch(err){
        console.log(err, "Failed to get admin")
    }
}