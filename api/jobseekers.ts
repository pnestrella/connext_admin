
export const getJobseekerCount = async () => {
    try{
        const url = `${process.env.NEXT_PUBLIC_BACKEND_BASE_URL}/api/jobseekers/getJobseekerCount`
        const res =  await fetch(url);

        console.log(res,'ress')
        return await res.json()
    }catch(err){
        console.log(err, "Failed to get admin")
    }
}