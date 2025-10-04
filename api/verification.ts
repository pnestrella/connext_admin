

export const getVerification = async (employerUID: string) => {
    try{
        const url = `${process.env.NEXT_PUBLIC_BACKEND_BASE_URL}/api/admins/getVerification/${employerUID}`
        const res =  await fetch(url);
        return await res.json()

    }catch(err){
        console.log(err, "Failed to get admin")
    }
}

//getting all of the  verification request counts
export const getAllVerificationsCount = async () => {
    try{
        const url = `${process.env.NEXT_PUBLIC_BACKEND_BASE_URL}/api/admins/getAllVerificationsCount`

        const res =  await fetch(url);

        return await res.json()

    }catch(err){
        console.log(err, "Failed to get admin")
    }
}


//getting all of the  verification request counts
export const getAllVerifications = async (status = "", page = 1, limit = 10) => {
  try {
    const params = new URLSearchParams();
    if (status && status !== "all") params.append("status", status); // only send if not "all"
    params.append("page", page.toString());
    params.append("limit", limit.toString());

    const url = `${process.env.NEXT_PUBLIC_BACKEND_BASE_URL}/api/admins/getAllVerifications?${params.toString()}`;
    const res = await fetch(url);
    return await res.json();
  } catch (err) {
    console.log(err, "Failed to get admin");
  }
};

//Reviewing verification requests
export const reviewVerification = async (status:string, reviewedBy:string, notes: string = '', verificationUID: string) => {
    try{
        const payload = {
            status,
            reviewedBy,
            notes
        }
        
        const url = `${process.env.NEXT_PUBLIC_BACKEND_BASE_URL}/api/admins/reviewVerification/${verificationUID}`
        const res =  await fetch(url,{
            method: "PATCH",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });
        return await res.json()

    }catch(err){
        console.log(err, "Failed to get admin")
    }
}




