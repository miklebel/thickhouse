# thickhouse
ClickHouse test app

# Запуск
Запуск через "npm run dev"

# Настройка через dotenv

PORT - Порт нашего сервера

CHURL - URL ClickHouse сервера

CHPORT - порт ClickHouse сервера

REDISIP - айпи Redis сервера

REDISPORT - порт Redis сервера

SYNCTIMER - таймер до синхронизации из Redis в CH в миллисекундах

MAXBUFFER - максимальный размер буфера до синхронизации

# Примеры запросов
Довляет нового покупателя в буфер Redis
<curl --location --request POST 'http://localhost:3000/create/customers' \
--header 'Content-Type: application/json' \
--data-raw '{
    "name": "name",
    "middlename": "middlename",
    "surname": "surname"
}'>

Добавляет нового работника в буфер Redis
curl --location --request POST 'http://localhost:3000/create/employees' \
--header 'Content-Type: application/json' \
--data-raw '{
    "name": "name",
    "middlename": "middlename",
    "surname": "surname"
}'

Получает данные из CH и Redis
curl --location --request GET 'http://localhost:3000/tables'
