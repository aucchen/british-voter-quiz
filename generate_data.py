import pandas as pd
import random
from data_utils import (
    read_data,
    get_gender,
    get_education_group,
    get_ethnicity,
    get_religion,
    get_mii_category,
    get_economic_lean,
    get_social_lean,
    get_voting_intention,
    get_preferred_party,
    get_home_ownership,
    get_constituency_name,
    get_country_emoji,
    generate_policies,
#    get_eu_referendum_intention,
#    get_eu_referendum_vote,
    get_past_vote,
    get_social_grade,
    get_working_status,
)

import traceback

def generate_tweet(row):
    """
    Returns a triple:
    - string representing the quiz text, 
    - string representing the answer text
    - tuple representing the acceptable parties (tuple of ints as described in get_party_name)
    """
    gender = get_gender(row["gender"])
    constituency = get_constituency_name(row["new_pcon_codeW29"])
    top_issue, verb = get_mii_category(row["mii_cat_llmW29"])
    age = int(row["ageW29"]) if not pd.isna(row["ageW29"]) else None
    religion = get_religion(row["p_religionW29"])
    ethnicity = get_ethnicity(row["p_ethnicityW29"])
    education = get_education_group(row["p_educationW29"])
    economic_lean = get_economic_lean(row["lr_scaleW27W29"])
    social_lean = get_social_lean(row["al_scaleW27W29"])
    home_ownership = get_home_ownership(row["homeOwn2W26W27"])
    country_emoji = get_country_emoji(row["countryW29"])

    v = get_voting_intention(row)
    if v is None:
        voting_intention = None
        voting_intention_code = 0
    else:
        voting_intention = v[0]
        voting_intention_code = v[1]
    p = get_preferred_party(row)
    if p is None:
        preferred_party = None
        preferred_party_code = 0
    else:
        preferred_party = p[0]
        preferred_party_code = p[1]
    past_vote = get_past_vote(row)

    #eu_referendum_vote = get_eu_referendum_vote(row.get("euRefVoteW9"))
    #eu_referendum_intention = get_eu_referendum_intention(row.get("euRefVoteAfterW29"))

    social_grade = get_social_grade(row["p_socgradeW29"])
    working_status = get_working_status(row["workingStatusW26W27W29"])

    if not gender or not voting_intention or not constituency:
        return None

    # Handle optional fields
    ethnicity_str = f"{ethnicity} " if ethnicity else ""
    religion_str = f"{religion} " if religion else ""

    # Build tweet sections
    tweet = ""

    # 1. Personal Description
    personal_desc = f"👤 I'm a {ethnicity_str}{religion_str}{gender}"
    if constituency and country_emoji:
        personal_desc += f" from {constituency} {country_emoji}"
    if age:
        personal_desc += f", aged {age}"
    if education:
        personal_desc += f", with {education}"
    # Ensure it ends with a period
    personal_desc = personal_desc.strip()
    if not personal_desc.endswith("."):
        personal_desc += "."
    tweet = add_section(tweet, personal_desc, False)

    # 2. Household/Work Status (Class)
    class_info = []
    if home_ownership:
        class_info.append(f"🏠 {home_ownership}")
    if working_status:
        class_info.append(working_status)
    elif social_grade:
        class_info.append(f"💼 My social grade is {social_grade}")
    if class_info:
        tweet = add_section(tweet, ". ".join(class_info))

    # 3. Top Issue
    if top_issue:
        tweet = add_section(tweet, f"{top_issue} {verb} my top issue.")

    # 4. Political Leans
    lean_parts = []
    if economic_lean:
        lean_parts.append(f"{economic_lean}")
    if social_lean:
        lean_parts.append(f"{social_lean}")

    if lean_parts:
        lean_sentence = "🤔 I am " + " and ".join(lean_parts) + "."
        tweet = add_section(tweet, lean_sentence)

    # TODO: set correct results
    # 5. Voting (Election)
    vote_text = f"🗳️ I voted {voting_intention} in 2024"
    if past_vote:
        vote_text += f". In 2019, I voted {past_vote}"
    if preferred_party and preferred_party != voting_intention:
        vote_text = f"🗳️ I wanted to vote {preferred_party}, but tactically voted {voting_intention} in 2024"

    # Ensure voting section ends with period
    #if not vote_text.endswith("."):
    #    vote_text += "."
    #tweet = add_section(tweet, vote_text)

    """
    # removing EU voting
    # 6. Voting (Ref)
    eu_text = " ".join(filter(None, [eu_referendum_vote, eu_referendum_intention]))
    if eu_text:
        tweet = add_section(tweet, eu_text)
    """

    # 7. Policies
    policies = generate_policies(row)
    if policies:
        # Shuffle and select up to 3 random policies
        random.shuffle(policies)
        # Ensure each policy ends with a period
        cleaned_policies = []
        for p in policies[:3]:
            p = p.strip()
            if not p.endswith("."):
                p += "."
            cleaned_policies.append(p)
        policy_text = "Some opinions I hold:\n" + "\n".join(
            [f"• {p}" for p in cleaned_policies]
        )
        tweet = add_section(tweet, policy_text)
    code = (voting_intention_code, preferred_party_code)

    return tweet, vote_text, code


def add_section(tweet, content, section_separator=True):
    if content:
        if tweet:  # Only add separator if tweet isn't empty
            tweet += "\n\n" if section_separator else " "
        tweet += content
    return tweet

if __name__ == '__main__':
    data = read_data()
    data_subset = data[data.wave29 > 0]
    print('number of rows:', len(data))
    tweets = []
    vote_texts = []
    party_codes = []
    tweets_f = open('web/data/tweets.txt', 'w')
    votes_f = open('web/data/votes.txt', 'w')
    party_f = open('web/data/party_codes.txt', 'w')
    for i in range(len(data_subset)):
        row = data_subset.iloc[i]
        if row.wave29 < 1:
            continue
        try:
            tweet, vote_text, code = generate_tweet(row)
        except Exception as e:
            traceback.print_exception(e)
            continue
        print(i)
        print(tweet)
        print(vote_text, code)
        # code[0] is the voting intention (i.e. the party actually voted for)
        if code[0] != 0 and code[0] != 99:
            tweets_f.write(tweet + '\n\n\n')
            votes_f.write(vote_text +  f'\t{int(code[0])},{int(code[1])}\n')
            party_f.write(f'{int(code[0])},{int(code[1])}\n')
            tweets.append(tweet)
            vote_texts.append(vote_text)
            party_codes.append(code)
    tweets_f.close()
    votes_f.close()
    party_f.close()
