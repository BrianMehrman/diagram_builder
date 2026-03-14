import { UserService } from '../../src/services/user-service'

const service = new UserService()
const user = service.createUser('Test', 'test@example.com')
console.log(user.getDisplayName())
