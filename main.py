x=int(input("enter name:"))
y=int(input("enter id:"))
leaderboard = {}
while True:
    name = input("Enter name (or 'exit' to quit): ")
    if name.lower() == 'exit':
        break
    id = input("Enter id: ")
    leaderboard[name] = id

print("Leaderboard:")
for name, id in leaderboard.items():
    print(f"{name}: {id}")