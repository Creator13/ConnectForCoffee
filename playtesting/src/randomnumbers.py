import random, pyperclip

with open("src/A.txt", "r") as file_a:
    questions_a = file_a.readlines()

with open("src/B.txt", "r") as file_b:
    questions_b = file_b.readlines()

questions_a = [line.strip() for line in questions_a]
questions_b = [line.strip() for line in questions_b]

questions_a_red = questions_a.copy()
questions_b_red = questions_b.copy()
questions_a_blue = questions_a.copy()
questions_b_blue = questions_b.copy()

letters = ['A', 'B', 'C', 'D']
variables = ["[COLOUR]", "[NUMBER]", "[TV SHOW]", "[GENRE]", "[SPORTS]"]

commands = ['EXIT']
commands += letters

command = ""
iteration = random.randint(0, 1)

while command != "EXIT":
    player = "red" if iteration % 2 == 0 else "blue"
    copy_text = ""

    copy_text += f"{player.capitalize()}:\n"

    if (player == "red"):
        pool_a = random.sample(questions_a_red, 2)
        pool_b = random.sample(questions_b_red, 2)
    elif (player == "blue"):
        pool_a = random.sample(questions_a_blue, 2)
        pool_b = random.sample(questions_b_blue, 2)

    pool = pool_a + pool_b

    for i in range(0, 4):
        newline = "\n" if i != 3 else ""
        copy_text += f"{letters[i]} - {pool[i]}{newline}"
    
    pyperclip.copy(copy_text)
    print(copy_text)

    iteration += 1

    command = ""
    while command not in commands:
        command = input("> ")
        command = command.strip()
        command = command.upper()

    if command in letters:
        remove = True
        question = pool[letters.index(command)]
        
        if any(variable in question for variable in variables):
            command2 = ""
            while command2.lower() not in ['yes', 'no', 'maybe']:
                command2 = input("> ")
                command2 = command2.strip()
                command2 = command2.upper()

            command2 = command2.strip()

            if command2.lower() == "no" or command2.lower() == "maybe":
                remove = False

        if remove:
            if player == "red":
                if command.upper() in ["A" , "B"]:
                    questions_a_red.remove(question)
                elif command.upper() in ["C" , "D"]:
                    questions_b_red.remove(question)
            elif player == "blue":
                if command.upper() in ["A" , "B"]:
                    questions_a_blue.remove(question)
                elif command.upper() in ["C" , "D"]:
                    questions_b_blue.remove(question)

input("Playtest ended. Press enter to exit...")