    
def big_from_dec(dec_in):
    # Initialize the big integer to 0
    big_int = 0

    # for each dec digit in reverse
    for letter in dec_in:
        digit = int(letter)
        # Multiply the current big integer by 10 and add the decimal digit
        big_int = big_int * 10 + digit
    return big_int

def limbs_from_big(big_int):
    limbs = [1,2,3,4]
    for i in range(4):
        limbs[i] = big_int & 0xffffffffffffffff
        big_int >>= 64
    limbs.reverse()
    return limbs

def limbs_to_hex_str(limbs):
    s = ""
    i = 0
    for l in reversed(limbs):
        c = ","
        i += 1
        if(i == 4):
            c = " "
        s = s + str(hex(l)) + c 
    return s

num_rows = len(A)
num_cols = len(A[0])
print(num_rows,    num_cols)
for i in range(num_rows):
    print("{")
    for j in range(num_cols):
        big = big_from_dec(A[i][j])
        limbs = limbs_from_big(big)
        #print(limbs)
        r = limbs_to_hex_str(limbs)
        comma = ","
        if(j == 2):
            comma = " "
        print("{",r,"}", comma)
    print("},")
print(A)
