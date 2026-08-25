import streamlit as st
from excel_generator import ExcelGenerator
from rag_service import QueryService
st.set_page_config(
    page_title = "YellowDoc.ai",
    layout="centered",
    initial_sidebar_state="auto"
)

st.title("YellowDoc.ai")

st.markdown(
    """
    #### Enterprise AI platform that transform invoices, receipts, tax documents, and financial records into structured intelligence.
    """
)
st.divider()
with st.form(key = "upload_documnet"):
    left, center, right = st.columns([3,4,3])
    with center:
        st.markdown("##### Upload Your Document")

        uploaded_file = st.file_uploader(
            "Tax Invoices, Receipts, Bills",
            type=["pdf"]
        )
        if uploaded_file is not None:
            st.session_state.uploaded_file = uploaded_file
        if "file_name" not in st.session_state:
            st.session_state.file_name=""
        if "saved_at" not in st.session_state:
                            st.session_state.saved_at = ""

        st.session_state.file_name = st.text_input("name of your excel file ")
        submit_btn = st.form_submit_button(label="Genrate the excel sheet")

        if submit_btn:
            file = st.session_state.get("uploaded_file")
            if file is None:
                st.error("Please Upload a File!")
            else:
                with st.spinner("Generating Excel..."):
                    st.session_state.saved_at = ExcelGenerator(
                        file, 
                        st.session_state.get("file_name")
                    ).convert()
                st.success(f"Excel File Generated Successfully!")

if st.session_state.saved_at:
    left, center, right = st.columns([3,10,3])
    with right:
        with open(st.session_state.saved_at, "rb") as f:
                st.download_button(
                label="Download Excel",
                data = f,
                file_name=f"{st.session_state.file_name}.xlsx",
                mime="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        )


if "messages" not in st.session_state:
    st.session_state.messages=[]
for message in st.session_state.messages:
    with st.chat_message(message['role']):
        st.markdown(message['content'])

if prompt := st.chat_input("Ask Anything related to your invoices, reciepts..."):
    st.session_state.messages.append(
        {
            "role" : "user",
            "content" : prompt
        }
    )

    with st.chat_message("user"):
        st.markdown(prompt)

    response = QueryService().get_response(prompt)

    answer = response["answer"]

    st.session_state.messages.append(
        {
            "role" : "ai",
            "content" : answer
        }
    )

    with st.chat_message("ai"):
        st.markdown(answer)