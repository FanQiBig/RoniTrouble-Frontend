import request from './request.js'

export const authApi = {
	login(email, password, keepSignedInFor7Days = false) {
		return request.post('/userCredential/login', {
			email,
			password,
			keepSignedInFor7Days
		})
	},

	register(email, password) {
		return request.post('/userCredential/register', {
			email,
			password
		})
	},

	registerStudent(email, password) {
		return request.post('/userCredential/register/student', {
			email,
			password
		})
	},

	registerMerchant(email, password, name, address, phoneNumber) {
		return request.post('/userCredential/register/merchant', {
			email,
			password,
			name,
			address,
			phoneNumber
		})
	}
}

export default authApi
