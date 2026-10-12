echo "Testing register..."
curl -X POST http://localhost:3000/api/auth/register -H "Content-Type: application/json" -d '{"email":"C", "password":"aaabbb11122234A!"}'
echo ""
echo "Testing jwt by getting user profile..."
curl -X GET http://localhost:3000/api/auth/user/profile -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4YjU0NWRlNjZiMDU2NWU2NmY1NzJlNCIsImlhdCI6MTc1NzAzNjc1NSwiZXhwIjoxNzU3MDQwMzU1fQ.zHssQ6LjFEQwrYczAQSVFsKo4cWjD42jzoLlTvYDd6M"" -H "Content-Type: application/json"
echo ""
